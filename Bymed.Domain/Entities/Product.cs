using System.Text.RegularExpressions;
using Bymed.Domain.Events;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Product : FullAuditedEntity
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public const int NameMaxLength = 500;
    public const int SlugMaxLength = 200;
    public const int SkuMaxLength = 100;
    public const int BrandMaxLength = 120;
    public const int ClientTypeMaxLength = 60;
    public const int CurrencyMaxLength = 3;
    public const string DefaultCurrency = "USD";

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = DefaultCurrency;
    public int InventoryCount { get; private set; }
    public int LowStockThreshold { get; private set; }
    public bool IsAvailable { get; private set; } = true;
    public string? Sku { get; private set; }
    public string? Brand { get; private set; }
    public string? ClientType { get; private set; }
    public IReadOnlyDictionary<string, string>? Specifications { get; private set; }

    private Product()
    {
    }

    public Product(
        string name,
        string slug,
        string description,
        Guid categoryId,
        decimal price,
        int inventoryCount,
        int lowStockThreshold,
        string? sku = null,
        string? brand = null,
        string? clientType = null,
        string? currency = null,
        IReadOnlyDictionary<string, string>? specifications = null)
    {
        SetName(name);
        SetSlug(slug);
        SetDescription(description);
        SetCategoryId(categoryId);
        SetPrice(price);
        SetInventoryCount(inventoryCount);
        SetLowStockThreshold(lowStockThreshold);
        Sku = SetSku(sku);
        Brand = SetBrand(brand);
        ClientType = SetClientType(clientType);
        Currency = string.IsNullOrWhiteSpace(currency) ? DefaultCurrency : currency.Trim().ToUpperInvariant();
        if (Currency.Length > CurrencyMaxLength)
            throw new ArgumentException($"Currency must not exceed {CurrencyMaxLength} characters.", nameof(currency));
        Specifications = specifications is null ? null : new Dictionary<string, string>(specifications);
    }


    public void Update(
        string name,
        string slug,
        string description,
        Guid categoryId,
        decimal price,
        int lowStockThreshold,
        string? sku = null,
        string? brand = null,
        string? clientType = null,
        IReadOnlyDictionary<string, string>? specifications = null)
    {
        SetName(name);
        SetSlug(slug);
        SetDescription(description);
        SetCategoryId(categoryId);
        SetPrice(price);
        SetLowStockThreshold(lowStockThreshold);
        Sku = SetSku(sku);
        Brand = SetBrand(brand);
        ClientType = SetClientType(clientType);
        Specifications = specifications is null ? null : new Dictionary<string, string>(specifications);
    }

 
    public void UpdateInventory(int newCount, string reason, string changedBy)
    {
        if (newCount < 0)
            throw new ArgumentException("Inventory count cannot be negative.", nameof(newCount));
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        ArgumentException.ThrowIfNullOrWhiteSpace(changedBy);

        var previousCount = InventoryCount;
        InventoryCount = newCount;

        if (InventoryCount == 0)
        {
            MarkAsUnavailable();
            AddDomainEvent(new ProductOutOfStockEvent(Id, Name, Sku));
        }

        AddDomainEvent(new InventoryChangedEvent(Id, previousCount, newCount, reason.Trim(), changedBy.Trim()));
    }

    public void MarkAsUnavailable()
    {
        IsAvailable = false;
    }

    public void SetAvailability(bool isAvailable)
    {
        IsAvailable = isAvailable;
    }

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Product name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Product name must not exceed {NameMaxLength} characters.", nameof(name));
        Name = trimmed;
    }

    private void SetSlug(string slug)
    {
        ArgumentNullException.ThrowIfNull(slug);
        var trimmed = slug.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Product slug is required.", nameof(slug));
        if (trimmed.Length > SlugMaxLength)
            throw new ArgumentException($"Product slug must not exceed {SlugMaxLength} characters.", nameof(slug));
        if (!SlugFormat.IsMatch(trimmed))
            throw new ArgumentException(
                "Product slug must be URL-safe: lowercase letters, digits, and hyphens only.",
                nameof(slug));
        Slug = trimmed;
    }

    private void SetDescription(string description)
    {
        ArgumentNullException.ThrowIfNull(description);
        Description = description.Trim();
    }

    private void SetCategoryId(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new ArgumentException("Category is required.", nameof(categoryId));
        CategoryId = categoryId;
    }

    private void SetPrice(decimal price)
    {
        if (price < 0)
            throw new ArgumentException("Price cannot be negative.", nameof(price));
        Price = price;
    }

    private void SetInventoryCount(int count)
    {
        if (count < 0)
            throw new ArgumentException("Inventory count cannot be negative.", nameof(count));
        InventoryCount = count;
    }

    private void SetLowStockThreshold(int threshold)
    {
        if (threshold < 0)
            throw new ArgumentException("Low stock threshold cannot be negative.", nameof(threshold));
        LowStockThreshold = threshold;
    }

    private static string? SetSku(string? sku)
    {
        if (string.IsNullOrWhiteSpace(sku)) return null;
        var trimmed = sku.Trim();
        if (trimmed.Length > SkuMaxLength)
            throw new ArgumentException($"SKU must not exceed {SkuMaxLength} characters.", nameof(sku));
        return trimmed;
    }

    private static string? SetBrand(string? brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return null;
        var trimmed = brand.Trim();
        if (trimmed.Length > BrandMaxLength)
            throw new ArgumentException($"Brand must not exceed {BrandMaxLength} characters.", nameof(brand));
        return trimmed;
    }

    private static string? SetClientType(string? clientType)
    {
        if (string.IsNullOrWhiteSpace(clientType)) return null;
        var trimmed = clientType.Trim();
        if (trimmed.Length > ClientTypeMaxLength)
            throw new ArgumentException($"Client type must not exceed {ClientTypeMaxLength} characters.", nameof(clientType));
        return trimmed;
    }
}
