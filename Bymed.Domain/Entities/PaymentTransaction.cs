using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;
using System.Text.RegularExpressions;

namespace Bymed.Domain.Entities;

public sealed class PaymentTransaction : FullAuditedEntity
{
    public const int ReferenceMaxLength = 100;
    public const int PayNowReferenceMaxLength = 50;
    public const int UrlMaxLength = 2048;
    public const int CurrencyMaxLength = 3;
    public const int RawPayloadMaxLength = 8000;

    public string Reference { get; private set; } = string.Empty;
    public string Currency { get; private set; } = Product.DefaultCurrency;
    public decimal Amount { get; private set; }

    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;

    public string? PayNowReference { get; private set; }
    public string? PollUrl { get; private set; }
    public string? RedirectUrl { get; private set; }

    public string? InitiationResponseRaw { get; private set; }
    public string? LastStatusUpdateRaw { get; private set; }

    // Requirement: never store complete credit card numbers.
    // We treat any 13-19 consecutive digits as card-like data and mask it.
    private static readonly Regex CardLikeDigitsRegex =
        new(@"\d{13,19}", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private PaymentTransaction()
    {
    }

    public PaymentTransaction(string reference, decimal amount, string currency)
    {
        SetReference(reference);
        SetAmount(amount);
        SetCurrency(currency);
        Status = PaymentStatus.Pending;
    }

    public void SetInitiationDetails(string? payNowReference, string? pollUrl, string? redirectUrl, string? initiationResponseRaw)
    {
        PayNowReference = TrimToMax(MaskCardLikeDigits(payNowReference), PayNowReferenceMaxLength);
        PollUrl = TrimToMax(MaskCardLikeDigits(pollUrl), UrlMaxLength);
        RedirectUrl = TrimToMax(MaskCardLikeDigits(redirectUrl), UrlMaxLength);
        InitiationResponseRaw = TrimToMax(MaskCardLikeDigits(initiationResponseRaw), RawPayloadMaxLength);
    }

    public void ApplyStatusUpdate(PaymentStatus status, string? payNowReference, string? pollUrl, string? statusUpdateRaw)
    {
        Status = status;
        PayNowReference = TrimToMax(MaskCardLikeDigits(payNowReference), PayNowReferenceMaxLength) ?? PayNowReference;
        PollUrl = TrimToMax(MaskCardLikeDigits(pollUrl), UrlMaxLength) ?? PollUrl;
        LastStatusUpdateRaw = TrimToMax(MaskCardLikeDigits(statusUpdateRaw), RawPayloadMaxLength);
    }

    private void SetReference(string reference)
    {
        ArgumentNullException.ThrowIfNull(reference);
        var trimmed = reference.Trim();
        if (trimmed.Length == 0)
            throw new ArgumentException("Reference is required.", nameof(reference));
        if (trimmed.Length > ReferenceMaxLength)
            throw new ArgumentException($"Reference must not exceed {ReferenceMaxLength} characters.", nameof(reference));
        Reference = trimmed;
    }

    private void SetAmount(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));
        Amount = amount;
    }

    private void SetCurrency(string currency)
    {
        ArgumentNullException.ThrowIfNull(currency);
        var trimmed = currency.Trim().ToUpperInvariant();
        if (trimmed.Length == 0)
            trimmed = Product.DefaultCurrency;
        if (trimmed.Length > CurrencyMaxLength)
            throw new ArgumentException($"Currency must not exceed {CurrencyMaxLength} characters.", nameof(currency));
        Currency = trimmed;
    }

    private static string? TrimToMax(string? value, int maxLen)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLen ? trimmed : trimmed[..maxLen];
    }

    private static string? MaskCardLikeDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value;

        return CardLikeDigitsRegex.Replace(value, match =>
        {
            var digits = match.Value;
            if (digits.Length <= 4)
                return digits;

            var maskedPrefix = new string('X', digits.Length - 4);
            var last4 = digits[^4..];
            return maskedPrefix + last4;
        });
    }
}

