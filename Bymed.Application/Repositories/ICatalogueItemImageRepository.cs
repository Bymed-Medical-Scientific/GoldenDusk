using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface ICatalogueItemImageRepository
{
    Task<CatalogueItemImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CatalogueItemImage>> GetByCatalogueItemIdAsync(Guid catalogueItemId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, string>> GetPrimaryImageUrlsByCatalogueItemIdsAsync(
        IReadOnlyCollection<Guid> catalogueItemIds,
        CancellationToken cancellationToken = default);
    void Add(CatalogueItemImage image);
    void Remove(CatalogueItemImage image);
}
