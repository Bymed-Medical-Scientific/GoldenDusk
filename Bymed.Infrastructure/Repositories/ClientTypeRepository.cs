using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class ClientTypeRepository : IClientTypeRepository
{
    private readonly ApplicationDbContext _context;

    public ClientTypeRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<ClientType>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ClientTypes
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<ClientType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ClientTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name))
            return false;

        var normalized = name.Trim().ToLowerInvariant();
        var query = _context.ClientTypes.Where(x => x.Name.ToLower() == normalized);
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);
        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> ExistsBySlugAsync(string slug, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        var normalized = slug.Trim().ToLowerInvariant();
        var query = _context.ClientTypes.Where(x => x.Slug.ToLower() == normalized);
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);
        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> HasClientsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Clients.AnyAsync(x => x.ClientTypeId == id, cancellationToken).ConfigureAwait(false);
    }

    public void Add(ClientType clientType)
    {
        ArgumentNullException.ThrowIfNull(clientType);
        _context.ClientTypes.Add(clientType);
    }

    public void Update(ClientType clientType)
    {
        ArgumentNullException.ThrowIfNull(clientType);
        _context.ClientTypes.Update(clientType);
    }

    public void Remove(ClientType clientType)
    {
        ArgumentNullException.ThrowIfNull(clientType);
        _context.ClientTypes.Remove(clientType);
    }
}
