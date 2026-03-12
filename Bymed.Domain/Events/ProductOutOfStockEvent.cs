using Bymed.Domain.Primitives;

namespace Bymed.Domain.Events;

/// <summary>
/// Domain event raised when a product goes out of stock
/// </summary>
public sealed class ProductOutOfStockEvent : DomainEvent
{
    public ProductOutOfStockEvent(Guid productId, string productName, string sku)
    {
        ProductId = productId;
        ProductName = productName;
        Sku = sku;
    }

    /// <summary>
    /// The ID of the product that is out of stock
    /// </summary>
    public Guid ProductId { get; }

    /// <summary>
    /// The name of the product
    /// </summary>
    public string ProductName { get; }

    /// <summary>
    /// The SKU of the product
    /// </summary>
    public string Sku { get; }
}
