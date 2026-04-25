namespace Bymed.Application.Quotations;

public sealed record UpdateQuotationRequest
{
    public required string CustomerName { get; init; }
    public required string CustomerInstitution { get; init; }
    public required string CustomerEmail { get; init; }
    public required string CustomerPhone { get; init; }
    public required string CustomerAddress { get; init; }
    public required string Subject { get; init; }
    public required string TargetCurrencyCode { get; init; }
    public decimal VatPercent { get; init; } = 15.5m;
    public bool ShowVatOnDocument { get; init; } = true;
    public string? Notes { get; init; }
    public string? TermsAndConditions { get; init; }
}
