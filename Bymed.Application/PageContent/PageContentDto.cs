namespace Bymed.Application.PageContent;

public sealed record PageMetadataDto
{
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
    public string? OgImage { get; init; }
}

public sealed record PageContentDto
{
    public required Guid Id { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Content { get; init; }
    public PageMetadataDto Metadata { get; init; } = new();
    public DateTime? PublishedAt { get; init; }
    public bool IsPublished { get; init; }
    public DateTime CreationTime { get; init; }
}
