namespace Bymed.Application.Quotations;

public sealed record UpdateQuotationPurchaseOrderRequest
{
    public bool HasPurchaseOrder { get; init; }
    public string? PurchaseOrderReference { get; init; }
}
