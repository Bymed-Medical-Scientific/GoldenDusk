using System.Security.Cryptography;
using System.Text;
using Bymed.Application.Payments;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Payments;

public sealed class PayNowPaymentService : IPaymentService
{
    private const string HashKey = "hash";
    private static readonly string[] InitiateFieldOrder =
    [
        "id",
        "reference",
        "amount",
        "additionalinfo",
        "returnurl",
        "resulturl",
        "authemail",
        "authphone",
        "authname",
        "tokenize",
        "merchanttrace",
        "status"
    ];

    private readonly HttpClient _httpClient;
    private readonly ILogger<PayNowPaymentService> _logger;
    private readonly PayNowOptions _options;
    private readonly IPaymentTransactionRepository _transactions;
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _uow;

    public PayNowPaymentService(
        HttpClient httpClient,
        ILogger<PayNowPaymentService> logger,
        IOptions<PayNowOptions> options,
        IPaymentTransactionRepository transactions,
        IOrderRepository orders,
        IUnitOfWork uow)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
        _orders = orders ?? throw new ArgumentNullException(nameof(orders));
        _uow = uow ?? throw new ArgumentNullException(nameof(uow));
    }

    public async Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string reference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reference))
            return new PaymentInitiationResult { Success = false, ErrorMessage = "Reference is required." };

        if (amount <= 0)
            return new PaymentInitiationResult { Success = false, ErrorMessage = "Amount must be greater than zero." };

        if (string.IsNullOrWhiteSpace(_options.IntegrationId) ||
            string.IsNullOrWhiteSpace(_options.IntegrationKey) ||
            string.IsNullOrWhiteSpace(_options.InitiateTransactionUrl) ||
            string.IsNullOrWhiteSpace(_options.ReturnUrl) ||
            string.IsNullOrWhiteSpace(_options.ResultUrl))
        {
            return new PaymentInitiationResult { Success = false, ErrorMessage = "PayNow is not configured." };
        }

        var normalizedReference = reference.Trim();
        var existing = await _transactions.GetByReferenceAsync(normalizedReference, cancellationToken).ConfigureAwait(false);
        if (existing is not null && existing.Status == PaymentStatus.Pending && !string.IsNullOrWhiteSpace(existing.RedirectUrl))
        {
            return new PaymentInitiationResult
            {
                Success = true,
                PaymentReference = existing.Reference,
                RedirectUrl = existing.RedirectUrl,
                PollUrl = existing.PollUrl
            };
        }

        var tx = existing ?? new PaymentTransaction(normalizedReference, amount, currency);
        if (existing is null)
            _transactions.Add(tx);

        var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["id"] = _options.IntegrationId.Trim(),
            ["reference"] = tx.Reference,
            ["amount"] = amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
            ["returnurl"] = _options.ReturnUrl.Trim(),
            ["resulturl"] = _options.ResultUrl.Trim(),
            ["status"] = "Message"
        };

        fields["hash"] = ComputeOutboundHash(fields, _options.IntegrationKey, InitiateFieldOrder);

        using var content = new FormUrlEncodedContent(fields);
        using var response = await _httpClient
            .PostAsync(_options.InitiateTransactionUrl, content, cancellationToken)
            .ConfigureAwait(false);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("PayNow initiate failed HTTP {StatusCode}. Body: {Body}", (int)response.StatusCode, raw);
            tx.SetInitiationDetails(null, null, null, raw);
            _transactions.Update(tx);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return new PaymentInitiationResult { Success = false, ErrorMessage = "Failed to initiate payment." };
        }

        var parsedOrdered = ParsePostStyleBodyOrdered(raw);
        var parsed = ToDictionary(parsedOrdered);
        if (!ValidateInboundHash(raw, _options.IntegrationKey))
        {
            _logger.LogWarning("PayNow initiate response hash validation failed for reference {Reference}.", tx.Reference);
            tx.SetInitiationDetails(null, null, null, raw);
            _transactions.Update(tx);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return new PaymentInitiationResult { Success = false, ErrorMessage = "Invalid PayNow response signature." };
        }

        var status = Get(parsed, "status");
        if (!string.Equals(status, "Ok", StringComparison.OrdinalIgnoreCase))
        {
            var error = Get(parsed, "error");
            tx.SetInitiationDetails(null, null, null, raw);
            _transactions.Update(tx);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return new PaymentInitiationResult { Success = false, ErrorMessage = error ?? "PayNow returned an error." };
        }

        var redirectUrl = Get(parsed, "browserurl");
        var pollUrl = Get(parsed, "pollurl");
        tx.SetInitiationDetails(null, pollUrl, redirectUrl, raw);
        _transactions.Update(tx);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new PaymentInitiationResult
        {
            Success = true,
            PaymentReference = tx.Reference,
            RedirectUrl = redirectUrl,
            PollUrl = pollUrl
        };
    }

    public async Task<PaymentResult> ConfirmPaymentAsync(string reference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reference))
            return new PaymentResult { Success = false, Status = PaymentStatus.Failed, ErrorMessage = "Reference is required." };

        if (string.IsNullOrWhiteSpace(_options.IntegrationKey))
            return new PaymentResult { Success = false, Status = PaymentStatus.Failed, ErrorMessage = "PayNow is not configured." };

        var tx = await _transactions.GetByReferenceAsync(reference.Trim(), cancellationToken).ConfigureAwait(false);
        if (tx is null)
            return new PaymentResult { Success = false, Status = PaymentStatus.Failed, ErrorMessage = "Payment transaction not found." };

        if (string.IsNullOrWhiteSpace(tx.PollUrl))
            return new PaymentResult { Success = false, Status = PaymentStatus.Failed, ErrorMessage = "Transaction cannot be confirmed (missing poll URL)." };

        using var empty = new StringContent(string.Empty, Encoding.UTF8, "application/x-www-form-urlencoded");
        using var response = await _httpClient.PostAsync(tx.PollUrl, empty, cancellationToken).ConfigureAwait(false);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("PayNow poll failed HTTP {StatusCode}. Body: {Body}", (int)response.StatusCode, raw);
            return new PaymentResult { Success = false, Status = tx.Status, ErrorMessage = "Failed to poll payment status." };
        }

        var parsedOrdered = ParsePostStyleBodyOrdered(raw);
        var parsed = ToDictionary(parsedOrdered);
        if (!ValidateInboundHash(raw, _options.IntegrationKey))
        {
            _logger.LogWarning("PayNow poll response hash validation failed for reference {Reference}.", tx.Reference);
            return new PaymentResult { Success = false, Status = tx.Status, ErrorMessage = "Invalid PayNow response signature." };
        }

        var statusText = Get(parsed, "status") ?? string.Empty;
        var payNowRef = Get(parsed, "paynowreference");
        var pollUrl = Get(parsed, "pollurl");
        var mapped = MapPayNowStatus(statusText);

        tx.ApplyStatusUpdate(mapped, payNowRef, pollUrl, raw);
        _transactions.Update(tx);

        var order = await _orders.GetByPaymentReferenceAsync(tx.Reference, cancellationToken).ConfigureAwait(false);
        if (order is not null)
        {
            order.SetPaymentStatus(mapped);
            _orders.Update(order);
        }

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new PaymentResult
        {
            Success = mapped != PaymentStatus.Failed,
            TransactionId = payNowRef,
            Status = mapped,
            ErrorMessage = mapped == PaymentStatus.Failed ? "Payment not successful." : null
        };
    }

    public async Task<WebhookResult> HandleWebhookAsync(PayNowWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(webhookEvent);

        if (string.IsNullOrWhiteSpace(_options.IntegrationKey))
            return new WebhookResult { Success = false, ErrorMessage = "PayNow is not configured." };

        var fields = webhookEvent.Fields;
        if (!ValidateInboundHash(webhookEvent.RawBody, _options.IntegrationKey))
        {
            _logger.LogWarning("Rejected PayNow webhook: invalid hash.");
            return new WebhookResult { Success = false, ErrorMessage = "Invalid signature." };
        }

        var reference = Get(fields, "reference");
        var payNowRef = Get(fields, "paynowreference");
        var statusText = Get(fields, "status") ?? string.Empty;
        var pollUrl = Get(fields, "pollurl");
        var mapped = MapPayNowStatus(statusText);

        PaymentTransaction? tx = null;
        if (!string.IsNullOrWhiteSpace(reference))
            tx = await _transactions.GetByReferenceAsync(reference.Trim(), cancellationToken).ConfigureAwait(false);
        if (tx is null && !string.IsNullOrWhiteSpace(payNowRef))
            tx = await _transactions.GetByPayNowReferenceAsync(payNowRef.Trim(), cancellationToken).ConfigureAwait(false);

        if (tx is null && !string.IsNullOrWhiteSpace(reference))
        {
            var amount = TryGetDecimal(fields, "amount");
            if (amount is not null && amount.Value > 0)
            {
                tx = new PaymentTransaction(reference.Trim(), amount.Value, Product.DefaultCurrency);
                _transactions.Add(tx);
            }
        }

        if (tx is not null)
        {
            tx.ApplyStatusUpdate(mapped, payNowRef, pollUrl, webhookEvent.RawBody);
            _transactions.Update(tx);
        }

        if (!string.IsNullOrWhiteSpace(reference))
        {
            var order = await _orders.GetByPaymentReferenceAsync(reference.Trim(), cancellationToken).ConfigureAwait(false);
            if (order is not null)
            {
                order.SetPaymentStatus(mapped);
                _orders.Update(order);
            }
        }

        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new WebhookResult
        {
            Success = true,
            Status = mapped,
            Reference = reference,
            PayNowReference = payNowRef
        };
    }

    public Task<RefundResult> RefundPaymentAsync(string reference, decimal? amount = null, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Refund requested for {Reference} but PayNow refund API is not implemented.", reference);
        return Task.FromResult(new RefundResult { Success = false, ErrorMessage = "Refunds are not supported via PayNow API integration." });
    }

    private static Dictionary<string, string> ParsePostStyleBody(string body)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(body))
            return dict;

        foreach (var pair in body.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = pair.IndexOf('=');
            if (idx <= 0)
                continue;
            var key = pair[..idx];
            var val = pair[(idx + 1)..];
            dict[key] = Uri.UnescapeDataString(val.Replace("+", " ", StringComparison.Ordinal));
        }
        return dict;
    }

    private static List<KeyValuePair<string, string>> ParsePostStyleBodyOrdered(string body)
    {
        var list = new List<KeyValuePair<string, string>>();
        if (string.IsNullOrWhiteSpace(body))
            return list;

        foreach (var pair in body.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = pair.IndexOf('=');
            if (idx <= 0)
                continue;
            var key = pair[..idx];
            var val = pair[(idx + 1)..];
            var decoded = Uri.UnescapeDataString(val.Replace("+", " ", StringComparison.Ordinal));
            list.Add(new KeyValuePair<string, string>(key, decoded));
        }

        return list;
    }

    private static Dictionary<string, string> ToDictionary(IEnumerable<KeyValuePair<string, string>> items)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in items)
        {
            dict[kvp.Key] = kvp.Value;
        }
        return dict;
    }

    private static bool ValidateInboundHash(string rawBody, string integrationKey)
    {
        var ordered = ParsePostStyleBodyOrdered(rawBody);
        if (ordered.Count == 0)
            return false;

        var expected = ordered.FirstOrDefault(k => string.Equals(k.Key, HashKey, StringComparison.OrdinalIgnoreCase)).Value;
        if (string.IsNullOrWhiteSpace(expected))
            return false;

        var computed = ComputeInboundHash(ordered, integrationKey);
        return string.Equals(expected.Trim(), computed, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeOutboundHash(IReadOnlyDictionary<string, string> fields, string integrationKey, IEnumerable<string> keyOrder)
    {
        var concat = new StringBuilder();
        foreach (var key in keyOrder)
        {
            if (fields.TryGetValue(key, out var value))
                concat.Append(value?.Trim() ?? string.Empty);
        }
        concat.Append(integrationKey);
        return Sha512UpperHex(concat.ToString());
    }

    private static string ComputeInboundHash(IEnumerable<KeyValuePair<string, string>> ordered, string integrationKey)
    {
        var concat = new StringBuilder();
        foreach (var kvp in ordered)
        {
            if (string.Equals(kvp.Key, HashKey, StringComparison.OrdinalIgnoreCase))
                continue;
            concat.Append(kvp.Value?.Trim() ?? string.Empty);
        }
        concat.Append(integrationKey);
        return Sha512UpperHex(concat.ToString());
    }

    private static string Sha512UpperHex(string input)
    {
        using var sha = SHA512.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        var hex = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
            hex.AppendFormat("{0:X2}", b);
        return hex.ToString();
    }

    private static string? Get(IReadOnlyDictionary<string, string> items, string key)
        => items.TryGetValue(key, out var value) ? value : items.FirstOrDefault(k => string.Equals(k.Key, key, StringComparison.OrdinalIgnoreCase)).Value;

    private static PaymentStatus MapPayNowStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return PaymentStatus.Pending;

        var s = status.Trim();
        if (s.Equals("Paid", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("Awaiting", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Delivered", StringComparison.OrdinalIgnoreCase))
            return PaymentStatus.Completed;

        if (s.Equals("Refunded", StringComparison.OrdinalIgnoreCase))
            return PaymentStatus.Refunded;

        if (s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Failed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Error", StringComparison.OrdinalIgnoreCase))
            return PaymentStatus.Failed;

        return PaymentStatus.Pending;
    }

    private static decimal? TryGetDecimal(IReadOnlyDictionary<string, string> fields, string key)
    {
        var s = Get(fields, key);
        if (string.IsNullOrWhiteSpace(s))
            return null;
        return decimal.TryParse(s, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var d)
            ? d
            : null;
    }

    private static string? TryGetString(IReadOnlyDictionary<string, string> fields, string key)
        => Get(fields, key);
}

