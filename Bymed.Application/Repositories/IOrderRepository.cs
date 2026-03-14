using Bymed.Application.Common;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;

namespace Bymed.Application.Repositories;

/// <summary>
/// Order persistence. Implemented in Infrastructure with EF Core.
/// </summary>
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<PagedResult<Order>> GetPagedAsync(PaginationParams pagination, Guid? userId = null, OrderStatus? status = null, CancellationToken cancellationToken = default);
    void Add(Order order);
    void Update(Order order);
}
