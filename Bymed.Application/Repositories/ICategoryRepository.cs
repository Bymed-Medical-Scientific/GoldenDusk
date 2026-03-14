using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

/// <summary>
/// Category persistence. Implemented in Infrastructure with EF Core.
/// </summary>
public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<Category>> GetPagedAsync(PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetAllOrderedByDisplayOrderAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludeCategoryId = null, CancellationToken cancellationToken = default);
    Task<bool> HasProductsAsync(Guid categoryId, CancellationToken cancellationToken = default);
    void Add(Category category);
    void Update(Category category);
    void Remove(Category category);
}
