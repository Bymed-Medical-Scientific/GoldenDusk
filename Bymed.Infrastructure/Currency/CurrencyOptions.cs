namespace Bymed.Infrastructure.Currency;

public sealed class CurrencyOptions
{
    public const string SectionName = "Currency";

    /// <summary>HTTPS base URL for Frankfurter (no trailing slash).</summary>
    public string ExchangeRateApiBaseUrl { get; init; } = "https://api.frankfurter.app";

    /// <summary>HTTPS base URL for IP geolocation (no trailing slash).</summary>
    public string GeoIpBaseUrl { get; init; } = "https://ipwho.is";

    /// <summary>Cache TTL for exchange rates.</summary>
    public int ExchangeRatesCacheHours { get; init; } = 24;
}
