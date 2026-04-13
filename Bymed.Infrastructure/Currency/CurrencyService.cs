using System.Collections.Frozen;
using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Bymed.Application.Currency;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Currency;

public sealed class CurrencyService : ICurrencyService
{
    private const string CacheKey = "Bymed:ExchangeRates:UsdBase:v1";

    private static readonly FrozenDictionary<string, string> CountryToCurrency =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["US"] = "USD",
            ["ZA"] = "ZAR",
            ["NA"] = "ZAR",
            ["BW"] = "ZAR",
            ["LS"] = "ZAR",
            ["SZ"] = "ZAR"
        }.ToFrozenDictionary(StringComparer.OrdinalIgnoreCase);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly CurrencyOptions _options;
    private readonly ILogger<CurrencyService> _logger;

    public CurrencyService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<CurrencyOptions> options,
        ILogger<CurrencyService> logger)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<ExchangeRates> GetExchangeRatesAsync(CancellationToken cancellationToken = default)
    {
        var ttl = TimeSpan.FromHours(Math.Clamp(_options.ExchangeRatesCacheHours, 1, 168));

        return await _cache.GetOrCreateAsync(
            CacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = ttl;
                return await FetchExchangeRatesAsync(cancellationToken);
            }) ?? throw new InvalidOperationException("Exchange rate cache returned null.");
    }

    public async Task<decimal> ConvertAsync(
        decimal amount,
        string fromCurrency,
        string toCurrency,
        CancellationToken cancellationToken = default)
    {
        var from = NormalizeCurrency(fromCurrency);
        var to = NormalizeCurrency(toCurrency);

        if (from is null || to is null)
            throw new ArgumentException("Currency must be one of USD, ZAR.");

        if (from == to)
            return amount;

        var rates = await GetExchangeRatesAsync(cancellationToken);
        return ConvertWithRates(amount, from, to, rates);
    }

    public async Task<string> DetectCurrencyAsync(string ipAddress, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
            return "USD";

        ipAddress = ipAddress.Trim();

        if (!IPAddress.TryParse(ipAddress, out var ip))
        {
            _logger.LogDebug("DetectCurrency: invalid IP format, defaulting to USD.");
            return "USD";
        }

        if (IPAddress.IsLoopback(ip) || IsPrivateOrLocal(ip))
            return "USD";

        try
        {
            var baseUrl = _options.GeoIpBaseUrl.TrimEnd('/');
            var uri = $"{baseUrl}/{Uri.EscapeDataString(ipAddress)}";
            using var response = await _http.GetAsync(uri, cancellationToken);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var payload = await JsonSerializer.DeserializeAsync<IpWhoResponse>(stream, JsonOptions, cancellationToken);
            if (payload is not { Success: true } || string.IsNullOrEmpty(payload.CountryCode))
                return "USD";

            if (CountryToCurrency.TryGetValue(payload.CountryCode, out var currency))
                return currency;

            return "USD";
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "DetectCurrency failed for IP; defaulting to USD.");
            return "USD";
        }
    }

    private static decimal ConvertWithRates(decimal amount, string from, string to, ExchangeRates rates)
    {
        var map = rates.Rates;
        var usdAmount = from == "USD"
            ? amount
            : amount / map[from];

        return to == "USD"
            ? usdAmount
            : usdAmount * map[to];
    }

    private async Task<ExchangeRates> FetchExchangeRatesAsync(CancellationToken cancellationToken)
    {
        var baseUrl = _options.ExchangeRateApiBaseUrl.TrimEnd('/');
        var targets = string.Join(',', CurrencyCodes.Supported.Where(c => c != "USD"));
        var uri = $"{baseUrl}/latest?from=USD&to={targets}";

        using var response = await _http.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<FrankfurterLatestResponse>(stream, JsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Exchange rate response was empty.");

        if (!string.Equals(payload.Base, "USD", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Unexpected base currency from provider: {payload.Base}");

        var rates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["USD"] = 1m
        };

        foreach (var (code, value) in payload.Rates)
            rates[code.ToUpperInvariant()] = value;

        return new ExchangeRates
        {
            BaseCurrency = "USD",
            Rates = rates,
            LastUpdated = DateTime.UtcNow
        };
    }

    private static string? NormalizeCurrency(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var upper = code.Trim().ToUpperInvariant();
        return CurrencyCodes.Supported.Contains(upper) ? upper : null;
    }

    private static bool IsPrivateOrLocal(IPAddress ip)
    {
        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();

        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            var bytes = ip.GetAddressBytes();
            return bytes[0] switch
            {
                10 => true,
                127 => true,
                0 when bytes[1] == 0 => true,
                169 when bytes[1] == 254 => true,
                172 when bytes[1] is >= 16 and <= 31 => true,
                192 when bytes[1] == 168 => true,
                _ => false
            };
        }

        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal)
                return true;

            var s = ip.ToString();
            if (s.StartsWith("fc", StringComparison.OrdinalIgnoreCase) || s.StartsWith("fd", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private sealed class FrankfurterLatestResponse
    {
        [JsonPropertyName("base")]
        public string Base { get; init; } = "";

        [JsonPropertyName("rates")]
        public Dictionary<string, decimal> Rates { get; init; } = new();
    }

    private sealed class IpWhoResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }

        [JsonPropertyName("country_code")]
        public string? CountryCode { get; init; }
    }
}
