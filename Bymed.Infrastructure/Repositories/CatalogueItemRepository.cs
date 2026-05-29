using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class CatalogueItemRepository : ICatalogueItemRepository
{
    private readonly ApplicationDbContext _context;

    public CatalogueItemRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<CatalogueItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CatalogueItems
            .Include(c => c.Category)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<CatalogueItem?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return null;

        return await _context.CatalogueItems
            .Include(c => c.Category)
            .FirstOrDefaultAsync(c => c.Slug == slug.Trim() && !c.IsDeleted, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<CatalogueItem>> GetPagedAsync(
        PaginationParams pagination,
        Guid? categoryId = null,
        bool? isPublished = null,
        string? brand = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.CatalogueItems
            .AsNoTracking()
            .Include(c => c.Category)
            .Where(c => !c.IsDeleted)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(c => c.CategoryId == categoryId.Value);
        if (isPublished.HasValue)
            query = query.Where(c => c.IsPublished == isPublished.Value);
        if (!string.IsNullOrWhiteSpace(brand))
        {
            var brandTerm = brand.Trim();
            query = query.Where(c => c.Brand != null && EF.Functions.ILike(c.Brand, $"%{brandTerm}%"));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim();
            query = query.Where(c =>
                EF.Functions.ILike(c.Name, $"%{searchTerm}%") ||
                EF.Functions.ILike(c.Description, $"%{searchTerm}%") ||
                (c.Sku != null && EF.Functions.ILike(c.Sku, $"%{searchTerm}%")));
        }

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<CatalogueItem>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public async Task<bool> ExistsSlugAsync(string slug, Guid? excludeCatalogueItemId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        var trimmed = slug.Trim();
        var query = _context.CatalogueItems.Where(c => c.Slug == trimmed && !c.IsDeleted);
        if (excludeCatalogueItemId.HasValue)
            query = query.Where(c => c.Id != excludeCatalogueItemId.Value);

        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public void Add(CatalogueItem item)
    {
        ArgumentNullException.ThrowIfNull(item);
        _context.CatalogueItems.Add(item);
    }

    public void Update(CatalogueItem item)
    {
        ArgumentNullException.ThrowIfNull(item);
        _context.CatalogueItems.Update(item);
    }
}
