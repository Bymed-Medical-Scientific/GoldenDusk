using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// A line item in a cart: product reference, quantity, and price snapshot at add time.
/// </summary>
public class CartItem : BaseEntity
{
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal PriceAtAdd { get; private set; }

    public Cart Cart { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    private CartItem()
    {
    }

    internal CartItem(Guid cartId, Guid productId, int quantity, decimal priceAtAdd)
    {
        if (cartId == Guid.Empty)
            throw new ArgumentException("Cart Id cannot be empty.", nameof(cartId));
        if (productId == Guid.Empty)
            throw new ArgumentException("Product Id cannot be empty.", nameof(productId));
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        if (priceAtAdd < 0)
            throw new ArgumentException("Price cannot be negative.", nameof(priceAtAdd));
        CartId = cartId;
        ProductId = productId;
        Quantity = quantity;
        PriceAtAdd = priceAtAdd;
    }

    internal void SetQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        Quantity = quantity;
    }

    /// <summary>
    /// Line total (Quantity * PriceAtAdd).
    /// </summary>
    public decimal GetLineTotal() => Quantity * PriceAtAdd;
}
