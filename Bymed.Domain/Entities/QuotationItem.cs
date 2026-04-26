using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class QuotationItem : BaseEntity
{
    public const int ProductNameMaxLength = 300;
    public const int ProductSkuMaxLength = 120;
    public const int ProductImageUrlMaxLength = 2048;
    public const int CurrencyCodeMaxLength = 3;

    public Guid QuotationId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductNameSnapshot { get; private set; } = string.Empty;
    public string ProductSkuSnapshot { get; private set; } = string.Empty;
    public string ProductImageUrlSnapshot { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public decimal SupplierUnitCost { get; private set; }
    public string SourceCurrencyCode { get; private set; } = "USD";
    public decimal ExchangeRateToTarget { get; private set; } = 1m;
    public decimal MarkupMultiplier { get; private set; } = 1m;
    public decimal UnitPriceExcludingVat { get; private set; }
    public decimal UnitVatAmount { get; private set; }
    public decimal UnitPriceIncludingVat { get; private set; }
    public decimal LineSubtotalExcludingVat { get; private set; }
    public decimal LineVatAmount { get; private set; }
    public decimal LineTotalIncludingVat { get; private set; }

    public Quotation? Quotation { get; private set; }

    private QuotationItem() { }

    internal QuotationItem(
        Guid quotationId,
        Guid productId,
        string productNameSnapshot,
        string? productSkuSnapshot,
        string? productImageUrlSnapshot,
        int quantity,
        decimal supplierUnitCost,
        string sourceCurrencyCode,
        decimal exchangeRateToTarget,
        decimal markupMultiplier,
        decimal vatPercent)
    {
        if (quotationId == Guid.Empty) throw new ArgumentException("Quotation id is required.", nameof(quotationId));
        if (productId == Guid.Empty) throw new ArgumentException("Product id is required.", nameof(productId));
        QuotationId = quotationId;
        ProductId = productId;
        SetProductNameSnapshot(productNameSnapshot);
        SetProductSkuSnapshot(productSkuSnapshot);
        SetProductImageUrlSnapshot(productImageUrlSnapshot);
        UpdatePricing(quantity, supplierUnitCost, sourceCurrencyCode, exchangeRateToTarget, markupMultiplier, vatPercent);
    }

    internal void UpdatePricing(
        int quantity,
        decimal supplierUnitCost,
        string sourceCurrencyCode,
        decimal exchangeRateToTarget,
        decimal markupMultiplier,
        decimal vatPercent)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        if (supplierUnitCost < 0) throw new ArgumentOutOfRangeException(nameof(supplierUnitCost), "Supplier unit cost cannot be negative.");
        if (exchangeRateToTarget <= 0) throw new ArgumentOutOfRangeException(nameof(exchangeRateToTarget), "Exchange rate must be greater than zero.");
        if (markupMultiplier <= 0) throw new ArgumentOutOfRangeException(nameof(markupMultiplier), "Markup multiplier must be greater than zero.");
        if (vatPercent < 0 || vatPercent > 100) throw new ArgumentOutOfRangeException(nameof(vatPercent), "VAT percent must be between 0 and 100.");

        Quantity = quantity;
        SupplierUnitCost = decimal.Round(supplierUnitCost, 4, MidpointRounding.AwayFromZero);
        SetSourceCurrencyCode(sourceCurrencyCode);
        ExchangeRateToTarget = decimal.Round(exchangeRateToTarget, 8, MidpointRounding.AwayFromZero);
        MarkupMultiplier = decimal.Round(markupMultiplier, 6, MidpointRounding.AwayFromZero);

        var convertedUnitCost = SupplierUnitCost * ExchangeRateToTarget;
        var unitExVat = convertedUnitCost * MarkupMultiplier;
        var unitVat = unitExVat * (vatPercent / 100m);
        var unitIncVat = unitExVat + unitVat;

        UnitPriceExcludingVat = decimal.Round(unitExVat, 2, MidpointRounding.AwayFromZero);
        UnitVatAmount = decimal.Round(unitVat, 2, MidpointRounding.AwayFromZero);
        UnitPriceIncludingVat = decimal.Round(unitIncVat, 2, MidpointRounding.AwayFromZero);
        LineSubtotalExcludingVat = decimal.Round(UnitPriceExcludingVat * Quantity, 2, MidpointRounding.AwayFromZero);
        LineVatAmount = decimal.Round(UnitVatAmount * Quantity, 2, MidpointRounding.AwayFromZero);
        LineTotalIncludingVat = decimal.Round(UnitPriceIncludingVat * Quantity, 2, MidpointRounding.AwayFromZero);
    }

    internal void UpdateVatPercent(decimal vatPercent) =>
        UpdatePricing(Quantity, SupplierUnitCost, SourceCurrencyCode, ExchangeRateToTarget, MarkupMultiplier, vatPercent);

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

    private void SetProductSkuSnapshot(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        if (trimmed.Length > ProductSkuMaxLength)
            throw new ArgumentException($"Product SKU must not exceed {ProductSkuMaxLength} characters.", nameof(value));
        ProductSkuSnapshot = trimmed;
    }

    private void SetProductImageUrlSnapshot(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        if (trimmed.Length > ProductImageUrlMaxLength)
            throw new ArgumentException($"Product image URL must not exceed {ProductImageUrlMaxLength} characters.", nameof(value));
        ProductImageUrlSnapshot = trimmed;
    }

    private void SetSourceCurrencyCode(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Source currency code is required.", nameof(value));
        if (trimmed.Length > CurrencyCodeMaxLength)
            throw new ArgumentException($"Source currency code must not exceed {CurrencyCodeMaxLength} characters.", nameof(value));
        SourceCurrencyCode = trimmed;
    }
}
