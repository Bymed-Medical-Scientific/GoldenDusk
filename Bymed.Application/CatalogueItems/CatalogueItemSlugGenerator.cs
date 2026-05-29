using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;

namespace Bymed.Application.CatalogueItems;

public sealed class CatalogueItemSlugGenerator : ICatalogueItemSlugGenerator
{
    private const string FallbackSlug = "catalogue-item";

    private readonly ICatalogueItemRepository _catalogueItemRepository;

    public CatalogueItemSlugGenerator(ICatalogueItemRepository catalogueItemRepository)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
    }

    public async Task<string> GenerateUniqueSlugAsync(
        string name,
        Guid? excludeCatalogueItemId = null,
        CancellationToken cancellationToken = default)
    {
        var baseSlug = SlugGenerator.FromName(name, CatalogueItem.SlugMaxLength);
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = FallbackSlug;

        var candidate = baseSlug;
        var suffix = 2;

        while (await _catalogueItemRepository
                   .ExistsSlugAsync(candidate, excludeCatalogueItemId, cancellationToken)
                   .ConfigureAwait(false))
        {
            candidate = SlugGenerator.WithNumericSuffix(baseSlug, suffix++, CatalogueItem.SlugMaxLength);
        }

        return candidate;
    }
}
