using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<bool> AnyAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .AnyAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<User?> GetByIdWithAddressesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Addresses)
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

    public async Task<IReadOnlyList<Address>> GetAddressesByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return addresses;
    }

    public async Task<Address?> GetAddressByIdAsync(Guid addressId, CancellationToken cancellationToken = default)
    {
        return await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId, cancellationToken)
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

    public async Task<IReadOnlyList<User>> GetPendingAdminRegistrationsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Admin && !u.IsActive)
            .OrderByDescending(u => u.CreationTime)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<string>> GetEmailsByRoleAndActiveAsync(
        UserRole role,
        bool isActive,
        Guid? excludeUserId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .AsNoTracking()
            .Where(u => u.Role == role && u.IsActive == isActive && u.EmailConfirmed);

        if (excludeUserId.HasValue)
            query = query.Where(u => u.Id != excludeUserId.Value);

        return await query
            .Select(u => u.Email)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
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

    public void AddAddress(Address address)
    {
        ArgumentNullException.ThrowIfNull(address);
        _context.Addresses.Add(address);
    }

    public void UpdateAddress(Address address)
    {
        ArgumentNullException.ThrowIfNull(address);
        _context.Addresses.Update(address);
    }

    public void RemoveAddress(Address address)
    {
        ArgumentNullException.ThrowIfNull(address);
        _context.Addresses.Remove(address);
    }
}
