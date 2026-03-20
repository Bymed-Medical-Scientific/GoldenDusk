using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed class GetInventoryHistoryQueryHandler : IRequestHandler<GetInventoryHistoryQuery, PagedResult<InventoryLogDto>>
{
    private readonly IInventoryLogRepository _inventoryLogRepository;

    public GetInventoryHistoryQueryHandler(IInventoryLogRepository inventoryLogRepository)
    {
        _inventoryLogRepository = inventoryLogRepository ?? throw new ArgumentNullException(nameof(inventoryLogRepository));
    }

    public async Task<PagedResult<InventoryLogDto>> Handle(GetInventoryHistoryQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var pagedLogs = await _inventoryLogRepository
            .GetPagedByProductIdAsync(request.ProductId, pagination, cancellationToken)
            .ConfigureAwait(false);

        var dtoItems = pagedLogs.Items
            .Select(log => new InventoryLogDto
            {
                Id = log.Id,
                ProductId = log.ProductId,
                PreviousCount = log.PreviousCount,
                NewCount = log.NewCount,
                ChangeAmount = log.ChangeAmount,
                Reason = log.Reason,
                ChangedBy = log.ChangedBy,
                CreatedAt = log.CreatedAt
            })
            .ToList();

        return new PagedResult<InventoryLogDto>(dtoItems, pagedLogs.PageNumber, pagedLogs.PageSize, pagedLogs.TotalCount);
    }
}
