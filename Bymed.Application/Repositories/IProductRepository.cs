using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default);
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetPagedAsync(PaginationParams pagination, Guid? categoryId = null, bool? isAvailable = null, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetInventoryPagedAsync(PaginationParams pagination, bool lowStockOnly = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetLowStockProductsAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludeProductId = null, CancellationToken cancellationToken = default);
    Task<int> CountByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    void Add(Product product);
    void Update(Product product);
}
