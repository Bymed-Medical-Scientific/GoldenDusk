namespace Bymed.Application.Common;

public sealed record TopProductRow
{
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public required int QuantitySold { get; init; }
    public required decimal Revenue { get; init; }
}
