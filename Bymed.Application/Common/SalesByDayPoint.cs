namespace Bymed.Application.Common;

public sealed record SalesByDayPoint
{
    public required DateOnly Date { get; init; }
    public required decimal Revenue { get; init; }
    public required int OrderCount { get; init; }
}
