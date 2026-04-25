namespace Bymed.Application.Currencies;

public sealed record UpdateCurrencyDefinitionRequest
{
    public required string Name { get; init; }
    public string? Symbol { get; init; }
    public int DecimalPlaces { get; init; } = 2;
    public bool IsActive { get; init; } = true;
}
