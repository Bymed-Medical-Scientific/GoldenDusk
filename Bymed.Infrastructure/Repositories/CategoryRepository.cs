using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of category persistence with pagination support.
/// </summary>
public class CategoryRepository : ICategoryRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return null;

        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Slug == slug.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<Category>> GetPagedAsync(PaginationParams pagination, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories.AsNoTracking().AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<Category>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public async Task<IReadOnlyList<Category>> GetAllOrderedByDisplayOrderAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<bool> ExistsSlugAsync(string slug, Guid? excludeCategoryId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        var query = _context.Categories.Where(c => c.Slug == slug.Trim());
        if (excludeCategoryId.HasValue)
            query = query.Where(c => c.Id != excludeCategoryId.Value);

        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> HasProductsAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AnyAsync(p => p.CategoryId == categoryId, cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        _context.Categories.Add(category);
    }

    public void Update(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        _context.Categories.Update(category);
    }

    public void Remove(Category category)
    {
        ArgumentNullException.ThrowIfNull(category);
        _context.Categories.Remove(category);
    }
}
