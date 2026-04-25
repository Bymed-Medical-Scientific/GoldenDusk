using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class ClientRepository : IClientRepository
{
    private readonly ApplicationDbContext _context;

    public ClientRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<Client>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Clients
            .AsNoTracking()
            .Include(x => x.ClientType)
            .OrderBy(x => x.InstitutionName)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Clients
            .Include(x => x.ClientType)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<bool> ExistsInstitutionNameAsync(
        string institutionName,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(institutionName))
            return false;

        var normalized = institutionName.Trim().ToLowerInvariant();
        var query = _context.Clients.Where(x => x.InstitutionName.ToLower() == normalized);
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);
        return await query.AnyAsync(cancellationToken).ConfigureAwait(false);
    }

    public void Add(Client client)
    {
        ArgumentNullException.ThrowIfNull(client);
        _context.Clients.Add(client);
    }

    public void Update(Client client)
    {
        ArgumentNullException.ThrowIfNull(client);
        _context.Clients.Update(client);
    }

    public void Remove(Client client)
    {
        ArgumentNullException.ThrowIfNull(client);
        _context.Clients.Remove(client);
    }
}
