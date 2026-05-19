using Bymed.Application.Clients;
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

    public async Task<IReadOnlyList<Client>> GetAllAsync(
        IReadOnlyCollection<Guid>? clientTypeIds = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Clients
            .AsNoTracking()
            .Include(x => x.ClientType)
            .Include(x => x.ContactPersons)
            .AsQueryable();

        if (clientTypeIds is { Count: > 0 })
            query = query.Where(x => clientTypeIds.Contains(x.ClientTypeId));

        return await query
            .OrderBy(x => x.InstitutionName)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<int> CountClientsByClientTypeIdsAsync(
        IReadOnlyCollection<Guid> clientTypeIds,
        CancellationToken cancellationToken = default)
    {
        if (clientTypeIds is not { Count: > 0 })
            return 0;

        return await _context.Clients
            .AsNoTracking()
            .Where(x => clientTypeIds.Contains(x.ClientTypeId))
            .CountAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ClientMarketingProjection>> GetClientMarketingProjectionsPageAsync(
        IReadOnlyCollection<Guid> clientTypeIds,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        if (clientTypeIds is not { Count: > 0 })
            return Array.Empty<ClientMarketingProjection>();

        var rows = await _context.Clients
            .AsNoTracking()
            .Include(x => x.ContactPersons)
            .Where(x => clientTypeIds.Contains(x.ClientTypeId))
            .OrderBy(x => x.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows
            .Select(x => new ClientMarketingProjection(
                x.Id,
                x.InstitutionName,
                x.Email,
                x.ContactPersons
                    .Select(cp => cp.Email)
                    .Where(email => !string.IsNullOrWhiteSpace(email))
                    .Select(email => email!)
                    .ToList()))
            .ToList();
    }

    public async Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Clients
            .Include(x => x.ClientType)
            .Include(x => x.ContactPersons)
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
