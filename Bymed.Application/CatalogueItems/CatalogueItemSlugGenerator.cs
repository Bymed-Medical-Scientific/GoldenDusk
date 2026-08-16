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

    public Task<string> GenerateUniqueSlugAsync(
        string name,
        Guid? excludeCatalogueItemId = null,
        CancellationToken cancellationToken = default) =>
        UniqueSlugGenerator.GenerateUniqueAsync(
            name,
            CatalogueItem.SlugMaxLength,
            FallbackSlug,
            (slug, ct) => _catalogueItemRepository.ExistsSlugAsync(slug, excludeCatalogueItemId, ct),
            cancellationToken);
}
