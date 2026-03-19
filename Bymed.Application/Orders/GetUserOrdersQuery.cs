using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record GetUserOrdersQuery(Guid UserId, int PageNumber, int PageSize) : IRequest<PagedResult<OrderDto>>;
