namespace Bymed.Application.Orders;

public sealed record OrderItemDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public required string ProductImageUrl { get; init; }
    public required int Quantity { get; init; }
    public required decimal PricePerUnit { get; init; }
    public required decimal Subtotal { get; init; }
}
