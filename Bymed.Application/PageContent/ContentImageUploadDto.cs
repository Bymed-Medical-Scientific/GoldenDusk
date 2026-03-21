namespace Bymed.Application.PageContent;

/// <summary>
/// Response for CMS page image upload (e.g. for rich text or Open Graph).
/// </summary>
public sealed record ContentImageUploadDto
{
    /// <summary>Public URL of the stored original image.</summary>
    public required string Url { get; init; }

    /// <summary>Stored file name (safe, unique).</summary>
    public required string FileName { get; init; }
}
