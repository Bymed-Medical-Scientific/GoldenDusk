using Bymed.Domain.Enums;

namespace Bymed.Application.Quotations;

public sealed record QuotationDto
{
    public required Guid Id { get; init; }
    public required string QuotationNumber { get; init; }
    public required QuotationStatus Status { get; init; }
    public required string CustomerName { get; init; }
    public required string CustomerInstitution { get; init; }
    public required string CustomerEmail { get; init; }
    public required string CustomerPhone { get; init; }
    public required string CustomerAddress { get; init; }
    public required string Subject { get; init; }
    public string? Notes { get; init; }
    public string? TermsAndConditions { get; init; }
    public required string TargetCurrencyCode { get; init; }
    public decimal VatPercent { get; init; }
    public bool ShowVatOnDocument { get; init; }
    public bool? HasPurchaseOrder { get; init; }
    public string? PurchaseOrderReference { get; init; }
    public decimal SubtotalExcludingVat { get; init; }
    public decimal VatAmount { get; init; }
    public decimal TotalIncludingVat { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? FinalizedAtUtc { get; init; }
    public required IReadOnlyList<QuotationItemDto> Items { get; init; }
}
