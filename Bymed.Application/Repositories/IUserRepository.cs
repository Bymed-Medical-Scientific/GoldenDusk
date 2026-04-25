using Bymed.Application.Common;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;

namespace Bymed.Application.Repositories;

public interface IUserRepository
{
    Task<bool> AnyAsync(CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithAddressesAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Address>> GetAddressesByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Address?> GetAddressByIdAsync(Guid addressId, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetPagedAsync(PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetEmailsByRoleAndActiveAsync(UserRole role, bool isActive, Guid? excludeUserId = null, CancellationToken cancellationToken = default);
    void Add(User user);
    void Update(User user);
    void AddAddress(Address address);
    void UpdateAddress(Address address);
    void RemoveAddress(Address address);
}
