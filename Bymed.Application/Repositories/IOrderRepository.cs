using Bymed.Application.Common;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;

namespace Bymed.Application.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Order?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default);
    Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<Order?> GetByPaymentReferenceAsync(string paymentReference, CancellationToken cancellationToken = default);
    Task<PagedResult<Order>> GetPagedAsync(
        PaginationParams pagination,
        Guid? userId = null,
        OrderStatus? status = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? search = null,
        CancellationToken cancellationToken = default);
    Task<OrderAnalyticsResult> GetAnalyticsAsync(DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken = default);
    IAsyncEnumerable<Order> GetOrdersForExportAsync(OrderStatus? status, DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken = default);
    void Add(Order order);
    void Update(Order order);
}
