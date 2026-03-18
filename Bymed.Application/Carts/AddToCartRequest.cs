namespace Bymed.Application.Carts;

public sealed record AddToCartRequest
{
    public required Guid ProductId { get; init; }
    public int Quantity { get; init; } = 1;
}

