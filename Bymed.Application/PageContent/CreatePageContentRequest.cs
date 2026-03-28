namespace Bymed.Application.PageContent;

public sealed record CreatePageContentRequest
{
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public required string Content { get; init; }
    public PageMetadataDto? Metadata { get; init; }

    /// <summary>When true, the page is published immediately.</summary>
    public bool Publish { get; init; }
}
