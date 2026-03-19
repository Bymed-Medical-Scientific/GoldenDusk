namespace Bymed.Application.Orders;

public sealed record CreateOrderRequest
{
    public required string IdempotencyKey { get; init; }
    public Guid? UserId { get; init; }
    public string? SessionId { get; init; }
    public required string CustomerEmail { get; init; }
    public required string CustomerName { get; init; }
    public required ShippingAddressDto ShippingAddress { get; init; }
    public required string PaymentMethod { get; init; }
    public string? Notes { get; init; }
    public decimal Tax { get; init; }
    public decimal ShippingCost { get; init; }
}
