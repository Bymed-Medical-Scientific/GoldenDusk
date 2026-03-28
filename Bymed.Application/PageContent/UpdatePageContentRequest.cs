namespace Bymed.Application.PageContent;

public sealed record UpdatePageContentRequest
{
    public string? Slug { get; init; }
    public string? Title { get; init; }
    public string? Content { get; init; }
    public PageMetadataDto? Metadata { get; init; }

    /// <summary>
    /// When true, publishes if not already published (no-op if already live).
    /// When false, unpublishes if currently published. When null, publication is unchanged.
    /// </summary>
    public bool? PublishState { get; init; }
}
