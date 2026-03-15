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

    public async Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            return null;

        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PagedResult<Order>> GetPagedAsync(PaginationParams pagination, Guid? userId = null, OrderStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();

        if (userId.HasValue)
            query = query.Where(o => o.UserId == userId.Value);
        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await query
            .OrderByDescending(o => o.CreationTime)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<Order>(items, pagination.PageNumber, pagination.PageSize, totalCount);
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
