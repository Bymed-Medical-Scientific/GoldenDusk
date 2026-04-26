using Bymed.Domain.Enums;

namespace Bymed.Application.Quotations;

public sealed record QuotationSummaryDto
{
    public required Guid Id { get; init; }
    public required string QuotationNumber { get; init; }
    public required QuotationStatus Status { get; init; }
    public required string CustomerName { get; init; }
    public required string CustomerInstitution { get; init; }
    public required string Subject { get; init; }
    public bool? HasPurchaseOrder { get; init; }
    public string? PurchaseOrderReference { get; init; }
    public decimal SubtotalExcludingVat { get; init; }
    public decimal VatAmount { get; init; }
    public decimal TotalIncludingVat { get; init; }
    public required string TargetCurrencyCode { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? FinalizedAtUtc { get; init; }
}
