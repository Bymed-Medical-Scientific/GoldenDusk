using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class BrandRepository : IBrandRepository
{
    private readonly ApplicationDbContext _context;

    public BrandRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Brands
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Brand?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Brands
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<bool> ExistsNameAsync(
        string name,
        Guid? excludeBrandId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name))
            return false;

        var trimmed = name.Trim();
        var query = _context.Brands.Where(b => b.Name == trimmed);
        if (excludeBrandId.HasValue)
            query = query.Where(b => b.Id != excludeBrandId.Value);

        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> CountCatalogueItemsAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await _context.CatalogueItems
            .CountAsync(c => c.BrandId == brandId && !c.IsDeleted, cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(Brand brand)
    {
        ArgumentNullException.ThrowIfNull(brand);
        _context.Brands.Add(brand);
    }

    public void Update(Brand brand)
    {
        ArgumentNullException.ThrowIfNull(brand);
        _context.Brands.Update(brand);
    }

    public void Remove(Brand brand)
    {
        ArgumentNullException.ThrowIfNull(brand);
        _context.Brands.Remove(brand);
    }
}
