using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record UpdateOrderStatusCommand(Guid OrderId, UpdateOrderStatusRequest Request) : IRequest<Result<OrderDto>>;
