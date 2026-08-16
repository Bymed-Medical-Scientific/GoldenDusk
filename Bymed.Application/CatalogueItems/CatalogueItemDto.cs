namespace Bymed.Application.CatalogueItems;

public sealed record CatalogueItemDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public required Guid CategoryId { get; init; }
    public required string CategoryName { get; init; }
    public string? PrimaryImageUrl { get; init; }
    public IReadOnlyList<CatalogueItemImageDto>? Images { get; init; }
    public bool IsPublished { get; init; }
    public Guid? BrandId { get; init; }
    public string? BrandName { get; init; }
    public string? BrandLogoUrl { get; init; }
    public string? BrandWebsiteUrl { get; init; }
}
