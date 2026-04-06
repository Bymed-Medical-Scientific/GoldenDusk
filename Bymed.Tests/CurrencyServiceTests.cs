using Bymed.Application.Currency;
using Bymed.Infrastructure.Currency;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Bymed.Tests;

public sealed class CurrencyServiceTests
{
    [Fact]
    public async Task GetExchangeRatesAsync_ParsesFrankfurterResponse()
    {
        var handler = new FakeHttpMessageHandler(req =>
        {
            if (req.RequestUri!.AbsolutePath.Contains("latest", StringComparison.Ordinal))
            {
                return new HttpResponseMessage
                {
                    StatusCode = System.Net.HttpStatusCode.OK,
                    Content = new StringContent(
                        """
                        {"amount":1.0,"base":"USD","date":"2025-03-21","rates":{"ZAR":18.5}}
                        """,
                        System.Text.Encoding.UTF8,
                        "application/json")
                };
            }

            return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
        });

        var http = new HttpClient(handler) { BaseAddress = new Uri("https://api.frankfurter.app/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CurrencyOptions());
        var sut = new CurrencyService(http, cache, options, NullLogger<CurrencyService>.Instance);

        var rates = await sut.GetExchangeRatesAsync();

        rates.BaseCurrency.Should().Be("USD");
        rates.Rates["ZAR"].Should().Be(18.5m);
        rates.Rates["USD"].Should().Be(1m);
    }

    [Fact]
    public async Task ConvertAsync_UsdToZar_UsesUsdBaseRates()
    {
        var handler = new FakeHttpMessageHandler(req =>
        {
            return new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(
                    """
                    {"amount":1.0,"base":"USD","date":"2025-03-21","rates":{"ZAR":20}}
                    """,
                    System.Text.Encoding.UTF8,
                    "application/json")
            };
        });

        var http = new HttpClient(handler);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CurrencyOptions());
        var sut = new CurrencyService(http, cache, options, NullLogger<CurrencyService>.Instance);

        var result = await sut.ConvertAsync(2m, "USD", "ZAR");
        result.Should().Be(40m);
    }

    [Fact]
    public async Task DetectCurrencyAsync_ReturnsUsd_ForNigeria()
    {
        var handler = new FakeHttpMessageHandler(req =>
        {
            if (req.RequestUri!.Host.Contains("ipwho", StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage
                {
                    StatusCode = System.Net.HttpStatusCode.OK,
                    Content = new StringContent(
                        """{"success":true,"country_code":"NG"}""",
                        System.Text.Encoding.UTF8,
                        "application/json")
                };
            }

            return new HttpResponseMessage(System.Net.HttpStatusCode.NotFound);
        });

        var http = new HttpClient(handler);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CurrencyOptions());
        var sut = new CurrencyService(http, cache, options, NullLogger<CurrencyService>.Instance);

        var currency = await sut.DetectCurrencyAsync("41.190.0.0");
        currency.Should().Be("USD");
    }

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

        public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_responder(request));
    }
}
