using MediatR;

namespace Bymed.Application.Inventory;

public sealed record GetLowStockProductsQuery : IRequest<IReadOnlyList<InventoryDto>>;
