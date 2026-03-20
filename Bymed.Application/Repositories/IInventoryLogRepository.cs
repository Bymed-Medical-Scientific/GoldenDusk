using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IInventoryLogRepository
{
    Task<PagedResult<InventoryLog>> GetPagedByProductIdAsync(
        Guid productId,
        PaginationParams pagination,
        CancellationToken cancellationToken = default);

    void Add(InventoryLog inventoryLog);
}
