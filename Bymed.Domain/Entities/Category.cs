using System.Text.RegularExpressions;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Category : FullAuditedEntity
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public const int NameMaxLength = 200;
    public const int SlugMaxLength = 200;

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int DisplayOrder { get; private set; }

    // EF Core
    private Category()
    {
    }

    public Category(string name, string slug, string? description, int displayOrder)
    {
        SetName(name);
        SetSlug(slug);
        Description = description;
        SetDisplayOrder(displayOrder);
    }

    public void Update(string name, string slug, string? description, int displayOrder)
    {
        SetName(name);
        SetSlug(slug);
        Description = description;
        SetDisplayOrder(displayOrder);
    }

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Category name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Category name must not exceed {NameMaxLength} characters.", nameof(name));
        Name = trimmed;
    }

    private void SetSlug(string slug)
    {
        ArgumentNullException.ThrowIfNull(slug);
        var trimmed = slug.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Category slug is required.", nameof(slug));
        if (trimmed.Length > SlugMaxLength)
            throw new ArgumentException($"Category slug must not exceed {SlugMaxLength} characters.", nameof(slug));
        if (!SlugFormat.IsMatch(trimmed))
            throw new ArgumentException(
                "Category slug must be URL-safe: lowercase letters, digits, and hyphens only (e.g. medical-equipment).",
                nameof(slug));
        Slug = trimmed;
    }

    private void SetDisplayOrder(int displayOrder)
    {
        if (displayOrder < 0)
            throw new ArgumentException("Display order must be zero or greater.", nameof(displayOrder));
        DisplayOrder = displayOrder;
    }
}
