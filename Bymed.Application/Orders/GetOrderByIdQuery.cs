using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record GetOrderByIdQuery(
    Guid OrderId,
    Guid? RequestingUserId,
    string? RequestingSessionId,
    bool IsAdmin) : IRequest<Result<OrderDto>>;
