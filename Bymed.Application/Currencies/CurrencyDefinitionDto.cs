namespace Bymed.Application.Currencies;

public sealed record CurrencyDefinitionDto
{
    public required Guid Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Symbol { get; init; }
    public int DecimalPlaces { get; init; }
    public bool IsActive { get; init; }
}
