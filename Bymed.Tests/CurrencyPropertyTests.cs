using Bymed.Application.Carts;
using Bymed.Application.Currency;
using Bymed.Application.Notifications;
using Bymed.Application.Orders;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;
using CurrencyOptions = Bymed.Infrastructure.Currency.CurrencyOptions;
using CurrencyService = Bymed.Infrastructure.Currency.CurrencyService;

namespace Bymed.Tests;

/// <summary>
/// Property 41: Currency Selection.
/// For any currency selection by the user, all displayed prices should be converted using current exchange rates.
/// Validates: Requirements 15.3, 15.4
/// </summary>
public sealed class CurrencySelectionPropertyTests
{
    [Property(MaxTest = 50)]
    public Property Selected_Currency_Uses_Current_Exchange_Rates()
    {
        var amountGen = ArbMap.Default.GeneratorFor<decimal>().Where(v => v >= 0m && v <= 50_000m);
        var zargen = ArbMap.Default.GeneratorFor<decimal>().Where(v => v >= 10m && v <= 30m);
        var kesGen = ArbMap.Default.GeneratorFor<decimal>().Where(v => v >= 80m && v <= 220m);
        var ngnGen = ArbMap.Default.GeneratorFor<decimal>().Where(v => v >= 800m && v <= 2500m);
        var selectedCurrencyGen = Gen.Elements(CurrencyCodes.Supported.ToArray());

        var scenarioArb =
            (from amount in amountGen
             from zar in zargen
             from kes in kesGen
             from ngn in ngnGen
             from selected in selectedCurrencyGen
             select new SelectionScenario(amount, zar, kes, ngn, selected)).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
        {
            var sut = CreateServiceForRates(scenario.ZarRate, scenario.KesRate, scenario.NgnRate);
            var converted = sut.ConvertAsync(scenario.Amount, "USD", scenario.SelectedCurrency, CancellationToken.None)
                .GetAwaiter().GetResult();

            var expected = scenario.SelectedCurrency switch
            {
                "USD" => scenario.Amount,
                "ZAR" => scenario.Amount * scenario.ZarRate,
                "KES" => scenario.Amount * scenario.KesRate,
                "NGN" => scenario.Amount * scenario.NgnRate,
                _ => throw new InvalidOperationException("Unexpected selected currency.")
            };

            converted.Should().Be(expected);
            return true;
        });
    }

    private static CurrencyService CreateServiceForRates(decimal zar, decimal kes, decimal ngn)
    {
        var payload = FormattableString.Invariant(
            $"{{\"amount\":1.0,\"base\":\"USD\",\"date\":\"2026-03-21\",\"rates\":{{\"ZAR\":{zar},\"KES\":{kes},\"NGN\":{ngn}}}}}");

        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage
        {
            StatusCode = System.Net.HttpStatusCode.OK,
            Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json")
        });

        var http = new HttpClient(handler);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CurrencyOptions());
        return new CurrencyService(http, cache, options, NullLogger<CurrencyService>.Instance);
    }

    private sealed record SelectionScenario(decimal Amount, decimal ZarRate, decimal KesRate, decimal NgnRate, string SelectedCurrency);
}

/// <summary>
/// Property 42: Currency Detection.
/// For any user location (based on IP or manual selection), the appropriate default currency should be selected.
/// Validates: Requirements 15.2
/// </summary>
public sealed class CurrencyDetectionPropertyTests
{
    [Property(MaxTest = 50)]
    public Property Detection_Returns_Supported_Currencies()
    {
        var codeGen = Gen.Elements("US", "ZA", "NG", "KE", "BW", "LS", "SZ", "NA", "FR", "DE", "BR", "AU");
        var scenarioArb = codeGen.Select(code => new DetectionScenario(code)).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
        {
            var payload = $"{{\"success\":true,\"country_code\":\"{scenario.CountryCode}\"}}";
            var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json")
            });

            var sut = new CurrencyService(
                new HttpClient(handler),
                new MemoryCache(new MemoryCacheOptions()),
                Options.Create(new CurrencyOptions()),
                NullLogger<CurrencyService>.Instance);

            var detected = sut.DetectCurrencyAsync("41.190.0.1", CancellationToken.None).GetAwaiter().GetResult();

            CurrencyCodes.Supported.Should().Contain(detected);

            var expected = scenario.CountryCode switch
            {
                "NG" => "NGN",
                "KE" => "KES",
                "ZA" or "BW" or "LS" or "SZ" or "NA" => "ZAR",
                _ => "USD"
            };

            detected.Should().Be(expected);
            return true;
        });
    }

    private sealed record DetectionScenario(string CountryCode);
}

/// <summary>
/// Property 43: Order Currency Recording.
/// For any created order, the order should record the currency used and exchange rate at creation time.
/// Validates: Requirements 15.6
/// </summary>
public sealed class OrderCurrencyRecordingPropertyTests
{
    [Property(MaxTest = 40)]
    public Property Created_Order_Records_Currency_And_ExchangeRate()
    {
        var userIdGen = ArbMap.Default.GeneratorFor<Guid>().Where(g => g != Guid.Empty);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p > 0m && p <= 1000m);
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q >= 1 && q <= 5);

        var scenarioArb =
            (from userId in userIdGen
             from price in priceGen
             from quantity in quantityGen
             select new OrderScenario(userId, price, quantity)).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var db = sp.GetRequiredService<ApplicationDbContext>();

            var productId = CartTestHelpers.SeedProductAsync(db, scenario.Price).GetAwaiter().GetResult();
            var addHandler = new AddToCartCommandHandler(
                sp.GetRequiredService<ICartRepository>(),
                sp.GetRequiredService<IProductRepository>(),
                sp.GetRequiredService<IUnitOfWork>());

            var addResult = addHandler.Handle(
                new AddToCartCommand(
                    scenario.UserId,
                    null,
                    new AddToCartRequest { ProductId = productId, Quantity = scenario.Quantity }),
                CancellationToken.None).GetAwaiter().GetResult();
            addResult.IsSuccess.Should().BeTrue(addResult.Error);

            var processHandler = new ProcessOrderCommandHandler(
                sp.GetRequiredService<IOrderRepository>(),
                sp.GetRequiredService<ICartRepository>(),
                sp.GetRequiredService<IProductRepository>(),
                sp.GetRequiredService<IProductImageRepository>(),
                sp.GetRequiredService<IUnitOfWork>(),
                Substitute.For<IEmailService>());

            var request = new CreateOrderRequest
            {
                IdempotencyKey = $"currency-{Guid.NewGuid():N}",
                UserId = scenario.UserId,
                SessionId = null,
                CustomerEmail = "currency@example.com",
                CustomerName = "Currency Customer",
                ShippingAddress = new ShippingAddressDto
                {
                    Name = "Currency Customer",
                    AddressLine1 = "123 Main",
                    AddressLine2 = null,
                    City = "Harare",
                    State = "Harare",
                    PostalCode = "00000",
                    Country = "ZW",
                    Phone = "263770000000"
                },
                PaymentMethod = "paynow",
                Tax = 1m,
                ShippingCost = 2m
            };

            var processResult = processHandler.Handle(new ProcessOrderCommand(request), CancellationToken.None)
                .GetAwaiter().GetResult();
            processResult.IsSuccess.Should().BeTrue(processResult.Error);

            var dto = processResult.Value!;
            dto.Currency.Should().Be(Product.DefaultCurrency);
            dto.ExchangeRate.Should().Be(1m);

            var persisted = sp.GetRequiredService<IOrderRepository>()
                .GetByIdAsync(dto.Id, CancellationToken.None).GetAwaiter().GetResult();
            persisted.Should().NotBeNull();
            persisted!.Currency.Should().Be(Product.DefaultCurrency);
            persisted.ExchangeRate.Should().Be(1m);

            return true;
        });
    }

    private sealed record OrderScenario(Guid UserId, decimal Price, int Quantity);
}

internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

    public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
    {
        _responder = responder;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        => Task.FromResult(_responder(request));
}
