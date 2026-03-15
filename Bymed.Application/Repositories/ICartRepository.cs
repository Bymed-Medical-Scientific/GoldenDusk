using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Cart?> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default);
    void Add(Cart cart);
    void Update(Cart cart);
    void Remove(Cart cart);
}
