using Bymed.Application.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Persistence;

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

    public void ClearTrackedChanges()
    {
        _context.ChangeTracker.Clear();
    }
}
