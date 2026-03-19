using Bymed.Application.Common;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record GetAllOrdersQuery(
    int PageNumber,
    int PageSize,
    OrderStatus? Status,
    DateTime? DateFrom,
    DateTime? DateTo) : IRequest<PagedResult<OrderDto>>;
