using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class CurrencyDefinitionRepository : ICurrencyDefinitionRepository
{
    private readonly ApplicationDbContext _context;

    public CurrencyDefinitionRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public void Add(CurrencyDefinition currencyDefinition)
    {
        ArgumentNullException.ThrowIfNull(currencyDefinition);
        _context.CurrencyDefinitions.Add(currencyDefinition);
    }

    public async Task<CurrencyDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            return null;

        return await _context.CurrencyDefinitions
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<CurrencyDefinition?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var normalized = code.Trim().ToUpperInvariant();
        return await _context.CurrencyDefinitions
            .FirstOrDefaultAsync(x => x.Code == normalized, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<CurrencyDefinition>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.CurrencyDefinitions
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<bool> IsCodeUniqueAsync(string code, Guid? excludeId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return false;

        var normalized = code.Trim().ToUpperInvariant();
        return !await _context.CurrencyDefinitions
            .AnyAsync(x => x.Code == normalized && (!excludeId.HasValue || x.Id != excludeId.Value), cancellationToken)
            .ConfigureAwait(false);
    }

    public void Remove(CurrencyDefinition currencyDefinition)
    {
        ArgumentNullException.ThrowIfNull(currencyDefinition);
        _context.CurrencyDefinitions.Remove(currencyDefinition);
    }
}
