using System.Runtime.CompilerServices;
using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Order?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return null;

        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.IdempotencyKey == idempotencyKey.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return null;

        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Order?> GetByPaymentReferenceAsync(string paymentReference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return null;

        var trimmed = paymentReference.Trim();
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.PaymentReference == trimmed, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<Order>> GetPagedAsync(
        PaginationParams pagination,
        Guid? userId = null,
        OrderStatus? status = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();

        if (userId.HasValue)
            query = query.Where(o => o.UserId == userId.Value);
        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);
        if (dateFrom.HasValue)
            query = query.Where(o => o.CreationTime >= dateFrom.Value.Date);
        if (dateTo.HasValue)
        {
            var endExclusive = dateTo.Value.Date.AddDays(1);
            query = query.Where(o => o.CreationTime < endExclusive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(term) ||
                o.CustomerEmail.ToLower().Contains(term) ||
                o.CustomerName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderByDescending(o => o.CreationTime)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<Order>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public async Task<OrderAnalyticsResult> GetAnalyticsAsync(DateTime? dateFrom, DateTime? dateTo, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders.AsNoTracking().AsQueryable();
        if (dateFrom.HasValue)
            query = query.Where(o => o.CreationTime >= dateFrom.Value.Date);
        if (dateTo.HasValue)
        {
            var endExclusive = dateTo.Value.Date.AddDays(1);
            query = query.Where(o => o.CreationTime < endExclusive);
        }

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var totalRevenue = totalCount > 0
            ? await query.SumAsync(o => o.Total, cancellationToken).ConfigureAwait(false)
            : 0m;
        var avgOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0m;

        var countByStatus = await query
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var dict = countByStatus.ToDictionary(x => x.Status, x => x.Count);
        foreach (var status in Enum.GetValues<OrderStatus>())
        {
            if (!dict.ContainsKey(status))
                dict[status] = 0;
        }

        var byDayRows = await query
            .GroupBy(o => o.CreationTime.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(x => x.Total), OrderCount = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var revenueByDay = byDayRows
            .Select(x => new SalesByDayPoint
            {
                Date = DateOnly.FromDateTime(x.Date),
                Revenue = x.Revenue,
                OrderCount = x.OrderCount
            })
            .ToList();

        IReadOnlyList<TopProductRow> topProducts;
        if (totalCount == 0)
        {
            topProducts = [];
        }
        else
        {
            var orderIdsInRange = query.Select(o => o.Id);
            topProducts = await _context.OrderItems
                .AsNoTracking()
                .Where(oi => orderIdsInRange.Contains(oi.OrderId))
                .GroupBy(oi => new { oi.ProductId, oi.ProductName })
                .Select(g => new TopProductRow
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    QuantitySold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Subtotal)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(10)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);
        }

        return new OrderAnalyticsResult
        {
            TotalOrderCount = totalCount,
            TotalRevenue = totalRevenue,
            AverageOrderValue = avgOrderValue,
            CountByStatus = dict,
            RevenueByDay = revenueByDay,
            TopProducts = topProducts
        };
    }

    public async IAsyncEnumerable<Order> GetOrdersForExportAsync(
        OrderStatus? status,
        DateTime? dateFrom,
        DateTime? dateTo,
        string? search = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);
        if (dateFrom.HasValue)
            query = query.Where(o => o.CreationTime >= dateFrom.Value.Date);
        if (dateTo.HasValue)
        {
            var endExclusive = dateTo.Value.Date.AddDays(1);
            query = query.Where(o => o.CreationTime < endExclusive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(term) ||
                o.CustomerEmail.ToLower().Contains(term) ||
                o.CustomerName.ToLower().Contains(term));
        }

        await foreach (var order in query.OrderByDescending(o => o.CreationTime).AsAsyncEnumerable().WithCancellation(cancellationToken))
        {
            yield return order;
        }
    }

    public void Add(Order order)
    {
        ArgumentNullException.ThrowIfNull(order);
        _context.Orders.Add(order);
    }

    public void Update(Order order)
    {
        ArgumentNullException.ThrowIfNull(order);
        _context.Orders.Update(order);
    }
}
