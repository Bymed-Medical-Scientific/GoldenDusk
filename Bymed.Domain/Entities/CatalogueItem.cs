using System.Text.RegularExpressions;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class CatalogueItem : FullAuditedEntity
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public const int NameMaxLength = 500;
    public const int SlugMaxLength = 200;
    public const int BrandMaxLength = 120;

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;
    public bool IsPublished { get; private set; } = true;
    public string? Brand { get; private set; }

    private CatalogueItem()
    {
    }

    public CatalogueItem(
        string name,
        string slug,
        string description,
        Guid categoryId,
        string? brand = null,
        bool isPublished = true)
    {
        SetName(name);
        SetSlug(slug);
        SetDescription(description);
        SetCategoryId(categoryId);
        Brand = SetBrand(brand);
        IsPublished = isPublished;
    }

    public void Update(
        string name,
        string description,
        Guid categoryId,
        string? brand = null)
    {
        SetName(name);
        SetDescription(description);
        SetCategoryId(categoryId);
        Brand = SetBrand(brand);
    }

    public void SetPublished(bool isPublished) => IsPublished = isPublished;

    public void Unpublish() => IsPublished = false;

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Catalogue item name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Catalogue item name must not exceed {NameMaxLength} characters.", nameof(name));
        Name = trimmed;
    }

    private void SetSlug(string slug)
    {
        ArgumentNullException.ThrowIfNull(slug);
        var trimmed = slug.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Catalogue item slug is required.", nameof(slug));
        if (trimmed.Length > SlugMaxLength)
            throw new ArgumentException($"Catalogue item slug must not exceed {SlugMaxLength} characters.", nameof(slug));
        if (!SlugFormat.IsMatch(trimmed))
            throw new ArgumentException(
                "Catalogue item slug must be URL-safe: lowercase letters, digits, and hyphens only.",
                nameof(slug));
        Slug = trimmed;
    }

    private void SetDescription(string description)
    {
        ArgumentNullException.ThrowIfNull(description);
        Description = description.Trim();
    }

    private void SetCategoryId(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new ArgumentException("Category is required.", nameof(categoryId));
        CategoryId = categoryId;
    }

    private static string? SetBrand(string? brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return null;
        var trimmed = brand.Trim();
        if (trimmed.Length > BrandMaxLength)
            throw new ArgumentException($"Brand must not exceed {BrandMaxLength} characters.", nameof(brand));
        return trimmed;
    }
}
