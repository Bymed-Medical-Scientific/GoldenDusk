using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed record GetInventoryHistoryQuery(
    Guid ProductId,
    int PageNumber,
    int PageSize) : IRequest<PagedResult<InventoryLogDto>>;
