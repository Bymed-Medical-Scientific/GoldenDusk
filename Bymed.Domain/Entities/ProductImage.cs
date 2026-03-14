using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// Image associated with a product (URL, alt text, display order).
/// </summary>
public class ProductImage : BaseEntity
{
    public const int UrlMaxLength = 2000;
    public const int AltTextMaxLength = 500;

    public Guid ProductId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string AltText { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }

    public Product Product { get; private set; } = null!;

    private ProductImage()
    {
    }

    public ProductImage(Guid productId, string url, string altText, int displayOrder)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("Product Id cannot be empty.", nameof(productId));
        SetUrl(url);
        SetAltText(altText);
        SetDisplayOrder(displayOrder);
        ProductId = productId;
    }

    public void Update(string url, string altText, int displayOrder)
    {
        SetUrl(url);
        SetAltText(altText);
        SetDisplayOrder(displayOrder);
    }

    private void SetUrl(string url)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url);
        var trimmed = url.Trim();
        if (trimmed.Length > UrlMaxLength)
            throw new ArgumentException($"URL must not exceed {UrlMaxLength} characters.", nameof(url));
        Url = trimmed;
    }

    private void SetAltText(string altText)
    {
        ArgumentNullException.ThrowIfNull(altText);
        var trimmed = altText.Trim();
        if (trimmed.Length > AltTextMaxLength)
            throw new ArgumentException($"Alt text must not exceed {AltTextMaxLength} characters.", nameof(altText));
        AltText = trimmed;
    }

    private void SetDisplayOrder(int order)
    {
        if (order < 0)
            throw new ArgumentException("Display order must be zero or greater.", nameof(order));
        DisplayOrder = order;
    }
}
