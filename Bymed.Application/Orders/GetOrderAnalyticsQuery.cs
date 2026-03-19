using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record GetOrderAnalyticsQuery(DateTime? DateFrom, DateTime? DateTo) : IRequest<OrderAnalyticsResult>;
