using Bymed.Application.Common;
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
        try
        {
            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException ex) when (DbUpdateExceptionHelper.IsOrderIdempotencyKeyConflict(ex))
        {
            throw new IdempotencyConflictException(
                "An order with the same idempotency key was created concurrently.",
                ex);
        }
    }

    public void ClearTrackedChanges()
    {
        _context.ChangeTracker.Clear();
    }
}
