using Bymed.Domain.Enums;

namespace Bymed.Application.Orders;

public sealed record UpdateOrderStatusRequest
{
    public required OrderStatus Status { get; init; }
    public string? TrackingNumber { get; init; }
    public string? Notes { get; init; }
}
