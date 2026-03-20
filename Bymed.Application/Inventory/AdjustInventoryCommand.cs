using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed record AdjustInventoryCommand(
    Guid ProductId,
    AdjustInventoryRequest Request,
    string ChangedBy) : IRequest<Result<InventoryDto>>;
