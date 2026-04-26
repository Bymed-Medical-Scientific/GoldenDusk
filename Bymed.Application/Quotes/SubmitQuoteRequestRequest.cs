namespace Bymed.Application.Quotes;

public sealed record SubmitQuoteRequestRequest
{
    public string FullName { get; init; } = string.Empty;
    public string Institution { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
    public IReadOnlyList<SubmitQuoteRequestItemRequest> Items { get; init; } = [];
}

public sealed record SubmitQuoteRequestItemRequest
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; } = 1;
}
