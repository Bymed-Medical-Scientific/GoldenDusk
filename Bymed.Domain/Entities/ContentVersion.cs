using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class ContentVersion : BaseEntity
{
    public const int CreatedByMaxLength = 256;

    public Guid PageContentId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    public PageContent PageContent { get; private set; } = null!;

    private ContentVersion()
    {
    }

    public ContentVersion(Guid pageContentId, string content, string createdBy)
    {
        if (pageContentId == Guid.Empty)
            throw new ArgumentException("Page content Id cannot be empty.", nameof(pageContentId));
        ArgumentNullException.ThrowIfNull(content);
        SetCreatedBy(createdBy);
        PageContentId = pageContentId;
        Content = content;
        CreatedAt = DateTime.UtcNow;
    }

    private void SetCreatedBy(string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(createdBy);
        var trimmed = createdBy.Trim();
        if (trimmed.Length > CreatedByMaxLength)
            throw new ArgumentException($"Created by must not exceed {CreatedByMaxLength} characters.", nameof(createdBy));
        CreatedBy = trimmed;
    }
}
