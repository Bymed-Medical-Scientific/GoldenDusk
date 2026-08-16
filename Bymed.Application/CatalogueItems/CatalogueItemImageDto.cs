namespace Bymed.Application.CatalogueItems;

public sealed record CatalogueItemImageDto
{
    public required Guid Id { get; init; }
    public required Guid CatalogueItemId { get; init; }
    public required string Url { get; init; }
    public required string AltText { get; init; }
    public int DisplayOrder { get; init; }
}
