using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class ProductImageRepository : IProductImageRepository
{
    private readonly ApplicationDbContext _context;

    public ProductImageRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<ProductImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ProductImages
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await _context.ProductImages
            .AsNoTracking()
            .Where(i => i.ProductId == productId)
            .OrderBy(i => i.DisplayOrder)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyDictionary<Guid, string>> GetPrimaryImageUrlsByProductIdsAsync(
        IReadOnlyCollection<Guid> productIds,
        CancellationToken cancellationToken = default)
    {
        if (productIds is null || productIds.Count == 0)
            return new Dictionary<Guid, string>();

        // Fetch the first (lowest DisplayOrder) image per product in a single query.
        var rows = await _context.ProductImages
            .AsNoTracking()
            .Where(i => productIds.Contains(i.ProductId))
            .OrderBy(i => i.ProductId)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => new { i.ProductId, i.Url })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var result = new Dictionary<Guid, string>();
        foreach (var row in rows)
        {
            if (!result.ContainsKey(row.ProductId))
                result[row.ProductId] = row.Url;
        }

        return result;
    }

    public void Add(ProductImage image)
    {
        ArgumentNullException.ThrowIfNull(image);
        _context.ProductImages.Add(image);
    }

    public void Remove(ProductImage image)
    {
        ArgumentNullException.ThrowIfNull(image);
        _context.ProductImages.Remove(image);
    }
}

