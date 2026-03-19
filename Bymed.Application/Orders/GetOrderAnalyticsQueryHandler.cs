using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class GetOrderAnalyticsQueryHandler : IRequestHandler<GetOrderAnalyticsQuery, OrderAnalyticsResult>
{
    private readonly IOrderRepository _orderRepository;

    public GetOrderAnalyticsQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public async Task<OrderAnalyticsResult> Handle(GetOrderAnalyticsQuery request, CancellationToken cancellationToken)
    {
        return await _orderRepository
            .GetAnalyticsAsync(request.DateFrom, request.DateTo, cancellationToken)
            .ConfigureAwait(false);
    }
}
