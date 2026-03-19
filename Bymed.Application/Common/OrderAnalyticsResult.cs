using Bymed.Domain.Enums;

namespace Bymed.Application.Common;

public sealed record OrderAnalyticsResult
{
    public required int TotalOrderCount { get; init; }
    public required decimal TotalRevenue { get; init; }
    public required decimal AverageOrderValue { get; init; }
    public required IReadOnlyDictionary<OrderStatus, int> CountByStatus { get; init; }
}
