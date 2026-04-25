namespace Bymed.Application.Quotations;

public sealed record UpsertQuotationItemRequest
{
    public required Guid ProductId { get; init; }
    public required string ProductNameSnapshot { get; init; }
    public string? ProductSkuSnapshot { get; init; }
    public string? ProductImageUrlSnapshot { get; init; }
    public int Quantity { get; init; }
    public decimal SupplierUnitCost { get; init; }
    public required string SourceCurrencyCode { get; init; }
    public decimal ExchangeRateToTarget { get; init; }
    public decimal MarkupMultiplier { get; init; }
}
