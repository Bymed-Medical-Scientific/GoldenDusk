using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly ApplicationDbContext _context;

    public CartRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Cart?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Cart?> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return null;

        return await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.SessionId == sessionId.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(Cart cart)
    {
        ArgumentNullException.ThrowIfNull(cart);
        _context.Carts.Add(cart);
    }

    public void Update(Cart cart)
    {
        ArgumentNullException.ThrowIfNull(cart);
        _context.Carts.Update(cart);
    }

    public void Remove(Cart cart)
    {
        ArgumentNullException.ThrowIfNull(cart);
        _context.Carts.Remove(cart);
    }
}
