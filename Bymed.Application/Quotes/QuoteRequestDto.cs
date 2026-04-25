using Bymed.Domain.Enums;

namespace Bymed.Application.Quotes;

public sealed record QuoteRequestDto
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
    public IReadOnlyList<QuoteRequestItemDto> Items { get; init; } = [];
}

public sealed record QuoteRequestItemDto
{
    public Guid ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public int Quantity { get; init; }
}
