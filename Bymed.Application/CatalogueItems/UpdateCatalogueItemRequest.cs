namespace Bymed.Application.CatalogueItems;

public sealed record UpdateCatalogueItemRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public required Guid CategoryId { get; init; }
    public string? Brand { get; init; }
    public bool IsPublished { get; init; } = true;
}
