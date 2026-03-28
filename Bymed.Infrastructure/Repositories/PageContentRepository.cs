using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public class PageContentRepository : IPageContentRepository
{
    private readonly ApplicationDbContext _context;

    public PageContentRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PageContent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PageContents
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PageContent?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return null;

        return await _context.PageContents
            .FirstOrDefaultAsync(p => p.Slug == slug.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<PageContent>> GetPagedAsync(
        PaginationParams pagination,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PageContents.AsNoTracking().AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderBy(p => p.Slug)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<PageContent>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public async Task<bool> ExistsSlugAsync(string slug, Guid? excludePageId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        var query = _context.PageContents.Where(p => p.Slug == slug.Trim());
        if (excludePageId.HasValue)
            query = query.Where(p => p.Id != excludePageId.Value);

        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public void Add(PageContent pageContent)
    {
        ArgumentNullException.ThrowIfNull(pageContent);
        _context.PageContents.Add(pageContent);
    }

    public void Update(PageContent pageContent)
    {
        ArgumentNullException.ThrowIfNull(pageContent);
        _context.PageContents.Update(pageContent);
    }

    public void AddVersion(ContentVersion version)
    {
        ArgumentNullException.ThrowIfNull(version);
        _context.ContentVersions.Add(version);
    }

    public async Task<PagedResult<ContentVersion>> GetVersionsForPageAsync(
        Guid pageContentId,
        PaginationParams pagination,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ContentVersions
            .AsNoTracking()
            .Where(v => v.PageContentId == pageContentId)
            .OrderByDescending(v => v.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<ContentVersion>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public async Task<ContentVersion?> GetVersionByIdForPageAsync(
        Guid versionId,
        Guid pageContentId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ContentVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.Id == versionId && v.PageContentId == pageContentId,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
