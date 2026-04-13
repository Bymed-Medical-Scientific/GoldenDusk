namespace Bymed.Application.Currency;

public interface ICurrencyService
{
    Task<ExchangeRates> GetExchangeRatesAsync(CancellationToken cancellationToken = default);

    Task<decimal> ConvertAsync(
        decimal amount,
        string fromCurrency,
        string toCurrency,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves a display currency (USD or ZAR) from the client IP using HTTPS geolocation.
    /// </summary>
    Task<string> DetectCurrencyAsync(string ipAddress, CancellationToken cancellationToken = default);
}
