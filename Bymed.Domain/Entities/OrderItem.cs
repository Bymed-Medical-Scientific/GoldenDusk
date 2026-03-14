using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// A line item on an order: snapshot of product name, image, quantity, and price at order time.
/// </summary>
public class OrderItem : BaseEntity
{
    public const int ProductNameMaxLength = 500;
    public const int ProductImageUrlMaxLength = 2000;

    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string ProductImageUrl { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public decimal PricePerUnit { get; private set; }
    public decimal Subtotal { get; private set; }

    public Order Order { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    private OrderItem()
    {
    }

    internal OrderItem(
        Guid orderId,
        Guid productId,
        string productName,
        string productImageUrl,
        int quantity,
        decimal pricePerUnit)
    {
        if (orderId == Guid.Empty)
            throw new ArgumentException("Order Id cannot be empty.", nameof(orderId));
        if (productId == Guid.Empty)
            throw new ArgumentException("Product Id cannot be empty.", nameof(productId));
        ArgumentException.ThrowIfNullOrWhiteSpace(productName);
        if (productName.Length > ProductNameMaxLength)
            throw new ArgumentException($"Product name must not exceed {ProductNameMaxLength} characters.", nameof(productName));
        productImageUrl ??= string.Empty;
        if (productImageUrl.Length > ProductImageUrlMaxLength)
            throw new ArgumentException($"Product image URL must not exceed {ProductImageUrlMaxLength} characters.", nameof(productImageUrl));
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        if (pricePerUnit < 0)
            throw new ArgumentException("Price per unit cannot be negative.", nameof(pricePerUnit));

        OrderId = orderId;
        ProductId = productId;
        ProductName = productName.Trim();
        ProductImageUrl = productImageUrl.Trim();
        Quantity = quantity;
        PricePerUnit = pricePerUnit;
        Subtotal = quantity * pricePerUnit;
    }
}
