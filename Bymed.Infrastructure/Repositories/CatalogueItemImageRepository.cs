using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class CatalogueItemImageRepository : ICatalogueItemImageRepository
{
    private readonly ApplicationDbContext _context;

    public CatalogueItemImageRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<CatalogueItemImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CatalogueItemImages
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<CatalogueItemImage>> GetByCatalogueItemIdAsync(
        Guid catalogueItemId,
        CancellationToken cancellationToken = default)
    {
        return await _context.CatalogueItemImages
            .AsNoTracking()
            .Where(i => i.CatalogueItemId == catalogueItemId)
            .OrderBy(i => i.DisplayOrder)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyDictionary<Guid, string>> GetPrimaryImageUrlsByCatalogueItemIdsAsync(
        IReadOnlyCollection<Guid> catalogueItemIds,
        CancellationToken cancellationToken = default)
    {
        if (catalogueItemIds is null || catalogueItemIds.Count == 0)
            return new Dictionary<Guid, string>();

        var rows = await _context.CatalogueItemImages
            .AsNoTracking()
            .Where(i => catalogueItemIds.Contains(i.CatalogueItemId))
            .OrderBy(i => i.CatalogueItemId)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => new { i.CatalogueItemId, i.Url })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var result = new Dictionary<Guid, string>();
        foreach (var row in rows)
        {
            if (!result.ContainsKey(row.CatalogueItemId))
                result[row.CatalogueItemId] = row.Url;
        }

        return result;
    }

    public void Add(CatalogueItemImage image)
    {
        ArgumentNullException.ThrowIfNull(image);
        _context.CatalogueItemImages.Add(image);
    }

    public void Remove(CatalogueItemImage image)
    {
        ArgumentNullException.ThrowIfNull(image);
        _context.CatalogueItemImages.Remove(image);
    }
}
