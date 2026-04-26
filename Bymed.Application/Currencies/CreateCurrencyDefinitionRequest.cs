namespace Bymed.Application.Currencies;

public sealed record CreateCurrencyDefinitionRequest
{
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Symbol { get; init; }
    public int DecimalPlaces { get; init; } = 2;
    public bool IsActive { get; init; } = true;
}
