using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IProductImageRepository
{
    Task<ProductImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken cancellationToken = default);
    void Add(ProductImage image);
    void Remove(ProductImage image);
}

