using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record ProcessOrderCommand(CreateOrderRequest Request) : IRequest<Result<OrderDto>>;
