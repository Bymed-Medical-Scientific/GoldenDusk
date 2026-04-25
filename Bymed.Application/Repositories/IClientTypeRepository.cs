using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IClientTypeRepository
{
    Task<IReadOnlyList<ClientType>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClientType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySlugAsync(string slug, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> HasClientsAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(ClientType clientType);
    void Update(ClientType clientType);
    void Remove(ClientType clientType);
}
