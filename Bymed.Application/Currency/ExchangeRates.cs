namespace Bymed.Application.Currency;

public sealed class ExchangeRates
{
    public required string BaseCurrency { get; init; }
    public required IReadOnlyDictionary<string, decimal> Rates { get; init; }
    public DateTime LastUpdated { get; init; }
}
