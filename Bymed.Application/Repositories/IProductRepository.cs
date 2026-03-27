using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

/// <summary>
/// Product persistence. Prefer <see cref="GetPagedAsync"/> for catalog lists with narrow column projections
/// at the repository level when performance requires it; map to list DTOs in the application layer rather than
/// over-fetching for grid views.
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    /// <summary>Paged catalog query; combine with caching in read handlers for hot paths.</summary>
    Task<PagedResult<Product>> GetPagedAsync(PaginationParams pagination, Guid? categoryId = null, bool? isAvailable = null, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetInventoryPagedAsync(PaginationParams pagination, bool lowStockOnly = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetLowStockProductsAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludeProductId = null, CancellationToken cancellationToken = default);
    Task<int> CountByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    void Add(Product product);
    void Update(Product product);
}
