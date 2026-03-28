using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed record GetInventoryQuery(
    int PageNumber,
    int PageSize,
    bool LowStockOnly,
    string? Search = null) : IRequest<PagedResult<InventoryDto>>;
