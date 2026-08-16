using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IBrandRepository
{
    Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Brand?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsNameAsync(string name, Guid? excludeBrandId = null, CancellationToken cancellationToken = default);
    Task<int> CountCatalogueItemsAsync(Guid brandId, CancellationToken cancellationToken = default);
    void Add(Brand brand);
    void Update(Brand brand);
    void Remove(Brand brand);
}
