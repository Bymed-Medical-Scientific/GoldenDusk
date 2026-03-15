namespace Bymed.Domain.ValueObjects;

// SEO and social metadata for a page. Owned by PageContent.
public sealed record PageMetadata
{
    public const int MetaTitleMaxLength = 100;
    public const int MetaDescriptionMaxLength = 300;
    public const int OgImageMaxLength = 2000;

    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
    public string? OgImage { get; init; }

    public PageMetadata()
    {
    }

    public PageMetadata(string? metaTitle, string? metaDescription, string? ogImage)
    {
        MetaTitle = ValidateLength(metaTitle, MetaTitleMaxLength, nameof(MetaTitle));
        MetaDescription = ValidateLength(metaDescription, MetaDescriptionMaxLength, nameof(MetaDescription));
        OgImage = ValidateLength(ogImage, OgImageMaxLength, nameof(OgImage));
    }

    private static string? ValidateLength(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new ArgumentException($"{paramName} must not exceed {maxLength} characters.", paramName);
        return trimmed;
    }
}
