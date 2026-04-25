namespace Bymed.Application.Quotations;

public sealed record QuotationItemDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string ProductNameSnapshot { get; init; }
    public required string ProductSkuSnapshot { get; init; }
    public required string ProductImageUrlSnapshot { get; init; }
    public int Quantity { get; init; }
    public decimal SupplierUnitCost { get; init; }
    public required string SourceCurrencyCode { get; init; }
    public decimal ExchangeRateToTarget { get; init; }
    public decimal MarkupMultiplier { get; init; }
    public decimal UnitPriceExcludingVat { get; init; }
    public decimal UnitVatAmount { get; init; }
    public decimal UnitPriceIncludingVat { get; init; }
    public decimal LineSubtotalExcludingVat { get; init; }
    public decimal LineVatAmount { get; init; }
    public decimal LineTotalIncludingVat { get; init; }
}
