using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of user persistence with pagination support.
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var normalized = email.Trim().ToUpperInvariant();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToUpper() == normalized, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<User>> GetPagedAsync(PaginationParams pagination, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderBy(u => u.Email)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<User>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public void Add(User user)
    {
        ArgumentNullException.ThrowIfNull(user);
        _context.Users.Add(user);
    }

    public void Update(User user)
    {
        ArgumentNullException.ThrowIfNull(user);
        _context.Users.Update(user);
    }
}
