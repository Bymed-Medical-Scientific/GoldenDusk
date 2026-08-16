namespace Bymed.Application.CatalogueItems;

public sealed record CreateCatalogueItemRequest
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required Guid CategoryId { get; init; }
    public Guid? BrandId { get; init; }
    public bool IsPublished { get; init; } = true;
}
