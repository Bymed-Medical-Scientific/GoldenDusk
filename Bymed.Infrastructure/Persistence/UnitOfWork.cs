using Bymed.Application.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Persistence;

/// <summary>
/// Unit of work implementation using the same ApplicationDbContext as the repositories.
/// Call SaveChangesAsync after one or more repository operations to persist in a single transaction.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
