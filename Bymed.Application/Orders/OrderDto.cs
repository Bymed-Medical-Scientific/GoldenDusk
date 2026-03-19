using Bymed.Domain.Enums;

namespace Bymed.Application.Orders;

public sealed record OrderDto
{
    public required Guid Id { get; init; }
    public required string OrderNumber { get; init; }
    public string? IdempotencyKey { get; init; }
    public Guid? UserId { get; init; }
    public required OrderStatus Status { get; init; }
    public required string CustomerEmail { get; init; }
    public required string CustomerName { get; init; }
    public required ShippingAddressDto ShippingAddress { get; init; }
    public required decimal Subtotal { get; init; }
    public required decimal Tax { get; init; }
    public required decimal ShippingCost { get; init; }
    public required decimal Total { get; init; }
    public required string Currency { get; init; }
    public decimal ExchangeRate { get; init; }
    public required PaymentStatus PaymentStatus { get; init; }
    public required string PaymentReference { get; init; }
    public required string PaymentMethod { get; init; }
    public string? TrackingNumber { get; init; }
    public string? Notes { get; init; }
    public required IReadOnlyList<OrderItemDto> Items { get; init; }
    public DateTime CreationTime { get; init; }
    public Guid? CreatorId { get; init; }
    public DateTime? LastModificationTime { get; init; }
    public Guid? LastModifierUserId { get; init; }
}
