using System.Text.RegularExpressions;
using Bymed.Domain.Primitives;
using Bymed.Domain.ValueObjects;

namespace Bymed.Domain.Entities;

/// <summary>
/// CMS page content (e.g. About, Terms). Slug, title, body content, and optional metadata.
/// </summary>
public class PageContent : FullAuditedEntity
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public const int SlugMaxLength = 200;
    public const int TitleMaxLength = 500;

    public string Slug { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public PageMetadata Metadata { get; private set; } = new();
    public DateTime? PublishedAt { get; private set; }

    private readonly List<ContentVersion> _versions = [];
    public IReadOnlyCollection<ContentVersion> Versions => _versions;

    private PageContent()
    {
    }

    public PageContent(string slug, string title, string content, PageMetadata? metadata = null)
    {
        SetSlug(slug);
        SetTitle(title);
        SetContent(content);
        Metadata = metadata ?? new PageMetadata();
    }

    public void Update(string slug, string title, string content, PageMetadata? metadata = null)
    {
        SetSlug(slug);
        SetTitle(title);
        SetContent(content);
        if (metadata is not null)
            Metadata = metadata;
    }

    /// <summary>
    /// Marks the page as published at the current time.
    /// </summary>
    public void Publish()
    {
        PublishedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Clears published date (unpublish).
    /// </summary>
    public void Unpublish()
    {
        PublishedAt = null;
    }

    public bool IsPublished => PublishedAt.HasValue;

    private void SetSlug(string slug)
    {
        ArgumentNullException.ThrowIfNull(slug);
        var trimmed = slug.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Slug is required.", nameof(slug));
        if (trimmed.Length > SlugMaxLength)
            throw new ArgumentException($"Slug must not exceed {SlugMaxLength} characters.", nameof(slug));
        if (!SlugFormat.IsMatch(trimmed))
            throw new ArgumentException("Slug must be URL-safe: lowercase letters, digits, and hyphens only.", nameof(slug));
        Slug = trimmed;
    }

    private void SetTitle(string title)
    {
        ArgumentNullException.ThrowIfNull(title);
        var trimmed = title.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Title is required.", nameof(title));
        if (trimmed.Length > TitleMaxLength)
            throw new ArgumentException($"Title must not exceed {TitleMaxLength} characters.", nameof(title));
        Title = trimmed;
    }

    private void SetContent(string content)
    {
        ArgumentNullException.ThrowIfNull(content);
        Content = content;
    }

    internal void AddVersion(ContentVersion version) => _versions.Add(version);
}
