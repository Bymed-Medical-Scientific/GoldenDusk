using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using Bymed.Application.Payments;
using Bymed.Application.Repositories;
using Bymed.Infrastructure.Payments;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

public class PaymentCardNonStoragePropertyTests
{
    // Property 33: Credit Card Non-Storage
    // Requirement 12.3
    // For any card-like digit sequence placed inside webhook payloads,
    // we must not persist the full sequence in PaymentTransactions.
    private sealed record Scenario(string CardDigits);

    [Property(MaxTest = 25)]
    public Property WebhookPayment_DoesNotPersistFullCardNumber()
    {
        const string integrationKey = "test-integration-key";
        const string reference = "ORDER-123";
        const string payNowRef = "PN-456";
        const string statusText = "Ok";
        const string amount = "1.00";

        var lenGen = ArbMap.Default.GeneratorFor<int>().Where(l => l >= 13 && l <= 19);
        var digitGen = ArbMap.Default.GeneratorFor<int>().Where(d => d >= 0 && d <= 9);

        var scenarioArb = (from len in lenGen
            from digits in Gen.ArrayOf(digitGen, len)
            select new Scenario(
                string.Concat(digits.Select(d => (char)('0' + d)))
            )).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
        {
            var cardDigits = scenario.CardDigits.Trim();

            var pollUrl = $"https://example.com/interface/check?guid={cardDigits}";

            // Build a PayNow-style inbound message (rawBody) with ordered key/value pairs.
            var rawWithoutHash =
                $"status={statusText}&reference={reference}&paynowreference={payNowRef}&amount={amount}&pollurl={pollUrl}";

            var hash = ComputeInboundHash(rawWithoutHash, integrationKey);
            var rawBody = $"{rawWithoutHash}&hash={hash}";

            var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["status"] = statusText,
                ["reference"] = reference,
                ["paynowreference"] = payNowRef,
                ["amount"] = amount,
                ["pollurl"] = pollUrl,
                ["hash"] = hash
            };

            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;

            var txRepo = sp.GetRequiredService<IPaymentTransactionRepository>();
            var orderRepo = sp.GetRequiredService<IOrderRepository>();
            var uow = sp.GetRequiredService<Bymed.Application.Persistence.IUnitOfWork>();

            var paymentService = new Bymed.Infrastructure.Payments.PayNowPaymentService(
                httpClient: new HttpClient(),
                logger: NullLogger<Bymed.Infrastructure.Payments.PayNowPaymentService>.Instance,
                options: new OptionsWrapper<Bymed.Infrastructure.Payments.PayNowOptions>(new()
                {
                    IntegrationId = "123",
                    IntegrationKey = integrationKey,
                    InitiateTransactionUrl = "https://example.com",
                    TraceUrl = "https://example.com",
                    ReturnUrl = "https://example.com",
                    ResultUrl = "https://example.com"
                }),
                transactions: txRepo,
                orders: orderRepo,
                uow: uow);

            var result = paymentService
                .HandleWebhookAsync(new PayNowWebhookEvent { Fields = fields, RawBody = rawBody })
                .GetAwaiter()
                .GetResult();

            result.Success.Should().BeTrue(result.ErrorMessage);

            var context = sp.GetRequiredService<ApplicationDbContext>();
            var stored = context.PaymentTransactions.SingleOrDefault();
            stored.Should().NotBeNull();

            stored!.PollUrl.Should().NotContain(cardDigits);
            stored.LastStatusUpdateRaw.Should().NotContain(cardDigits);

            return true;
        });
    }

    private static string ComputeInboundHash(string rawWithoutHash, string integrationKey)
    {
        // PayNow: concatenate all values EXCEPT hash, then append IntegrationKey, then SHA512 uppercase hex.
        // rawWithoutHash is in the form "k=v&k=v&..."; we only need the values, in order.
        var values = rawWithoutHash.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(pair =>
            {
                var idx = pair.IndexOf('=');
                return idx >= 0 ? pair[(idx + 1)..] : string.Empty;
            });

        var concat = new StringBuilder();
        foreach (var v in values)
            concat.Append(v.Trim());
        concat.Append(integrationKey);

        using var sha = SHA512.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(concat.ToString()));
        var hex = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
            hex.AppendFormat("{0:X2}", b);
        return hex.ToString();
    }
}

