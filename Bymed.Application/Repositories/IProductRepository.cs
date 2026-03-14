using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

/// <summary>
/// Product persistence. Implemented in Infrastructure with EF Core.
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetPagedAsync(PaginationParams pagination, Guid? categoryId = null, bool? isAvailable = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludeProductId = null, CancellationToken cancellationToken = default);
    Task<int> CountByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    void Add(Product product);
    void Update(Product product);
}
