namespace Bymed.Application.PageContent;

public sealed record UpdatePageContentRequest
{
    public string? Slug { get; init; }
    public string? Title { get; init; }
    public string? Content { get; init; }
    public PageMetadataDto? Metadata { get; init; }
}
