using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class QuoteRequestItem : BaseEntity
{
    public const int ProductNameMaxLength = 300;
    public const int ProductSkuMaxLength = 120;

    public Guid QuoteRequestId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductNameSnapshot { get; private set; } = string.Empty;
    public string ProductSkuSnapshot { get; private set; } = string.Empty;
    public int Quantity { get; private set; }

    public QuoteRequest? QuoteRequest { get; private set; }

    private QuoteRequestItem() { }

    internal QuoteRequestItem(Guid quoteRequestId, Guid productId, string productNameSnapshot, string productSkuSnapshot, int quantity)
    {
        if (quoteRequestId == Guid.Empty) throw new ArgumentException("Quote request id is required.", nameof(quoteRequestId));
        if (productId == Guid.Empty) throw new ArgumentException("Product id is required.", nameof(productId));
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");

        QuoteRequestId = quoteRequestId;
        ProductId = productId;
        Quantity = quantity;
        SetProductNameSnapshot(productNameSnapshot);
        SetProductSkuSnapshot(productSkuSnapshot);
    }

    private void SetProductNameSnapshot(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Product name is required.", nameof(value));
        if (trimmed.Length > ProductNameMaxLength)
            throw new ArgumentException($"Product name must not exceed {ProductNameMaxLength} characters.", nameof(value));
        ProductNameSnapshot = trimmed;
    }

    private void SetProductSkuSnapshot(string value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        if (trimmed.Length > ProductSkuMaxLength)
            throw new ArgumentException($"Product SKU must not exceed {ProductSkuMaxLength} characters.", nameof(value));
        ProductSkuSnapshot = trimmed;
    }
}
