using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class InventoryLogRepository : IInventoryLogRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryLogRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PagedResult<InventoryLog>> GetPagedByProductIdAsync(
        Guid productId,
        PaginationParams pagination,
        CancellationToken cancellationToken = default)
    {
        var query = _context.InventoryLogs
            .AsNoTracking()
            .Where(log => log.ProductId == productId);

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(log => log.CreatedAt)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<InventoryLog>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }

    public void Add(InventoryLog inventoryLog)
    {
        ArgumentNullException.ThrowIfNull(inventoryLog);
        _context.InventoryLogs.Add(inventoryLog);
    }
}
