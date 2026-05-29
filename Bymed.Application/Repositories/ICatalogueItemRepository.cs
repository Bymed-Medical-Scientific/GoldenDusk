using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface ICatalogueItemRepository
{
    Task<CatalogueItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CatalogueItem?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<CatalogueItem>> GetPagedAsync(
        PaginationParams pagination,
        Guid? categoryId = null,
        bool? isPublished = null,
        string? brand = null,
        string? search = null,
        CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludeCatalogueItemId = null, CancellationToken cancellationToken = default);
    void Add(CatalogueItem item);
    void Update(CatalogueItem item);
}
