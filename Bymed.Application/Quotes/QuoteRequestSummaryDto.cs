using Bymed.Domain.Enums;

namespace Bymed.Application.Quotes;

public sealed record QuoteRequestSummaryDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Institution { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
    public QuoteRequestStatus Status { get; init; }
    public DateTime SubmittedAtUtc { get; init; }
    public int ItemCount { get; init; }
}
