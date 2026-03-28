using Bymed.Domain.Enums;

namespace Bymed.Application.Common;

public sealed record OrderAnalyticsResult
{
    public required int TotalOrderCount { get; init; }
    public required decimal TotalRevenue { get; init; }
    public required decimal AverageOrderValue { get; init; }
    public required IReadOnlyDictionary<OrderStatus, int> CountByStatus { get; init; }
    /// <summary>Daily buckets for charting (order creation date in UTC, grouped by calendar day).</summary>
    public required IReadOnlyList<SalesByDayPoint> RevenueByDay { get; init; }
    /// <summary>Top products by line revenue in the filtered period.</summary>
    public required IReadOnlyList<TopProductRow> TopProducts { get; init; }
}
