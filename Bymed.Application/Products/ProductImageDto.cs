namespace Bymed.Application.Products;

public sealed record ProductImageDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public required string Url { get; init; }
    public required string AltText { get; init; }
    public int DisplayOrder { get; init; }
}

