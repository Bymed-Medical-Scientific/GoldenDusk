using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record GetOrderByIdQuery(Guid OrderId, Guid? RequestingUserId, bool IsAdmin) : IRequest<Result<OrderDto>>;
