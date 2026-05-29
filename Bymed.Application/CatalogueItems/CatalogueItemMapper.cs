using Bymed.Domain.Entities;

namespace Bymed.Application.CatalogueItems;

internal static class CatalogueItemMapper
{
    public static CatalogueItemDto ToDto(
        CatalogueItem item,
        string? primaryImageUrl = null,
        IReadOnlyList<CatalogueItemImageDto>? images = null) =>
        new()
        {
            Id = item.Id,
            Name = item.Name,
            Slug = item.Slug,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name,
            PrimaryImageUrl = primaryImageUrl ?? images?.FirstOrDefault()?.Url,
            Images = images,
            IsPublished = item.IsPublished,
            BrandId = item.BrandId,
            BrandName = item.Brand?.Name,
            BrandLogoUrl = item.Brand?.LogoUrl,
            BrandWebsiteUrl = item.Brand?.WebsiteUrl,
        };
}
