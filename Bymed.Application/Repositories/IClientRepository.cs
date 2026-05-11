using Bymed.Application.Clients;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IClientRepository
{
    /// <summary>
    /// Returns clients ordered by institution name. When <paramref name="clientTypeIds"/> is non-empty,
    /// only clients whose <see cref="Client.ClientTypeId"/> is in the set are returned.
    /// </summary>
    Task<IReadOnlyList<Client>> GetAllAsync(
        IReadOnlyCollection<Guid>? clientTypeIds = null,
        CancellationToken cancellationToken = default);

    Task<int> CountClientsByClientTypeIdsAsync(
        IReadOnlyCollection<Guid> clientTypeIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ClientMarketingProjection>> GetClientMarketingProjectionsPageAsync(
        IReadOnlyCollection<Guid> clientTypeIds,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsInstitutionNameAsync(
        string institutionName,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);
    void Add(Client client);
    void Update(Client client);
    void Remove(Client client);
}
