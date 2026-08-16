using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;

    public GetOrderByIdQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(request.OrderId, cancellationToken).ConfigureAwait(false);
        if (order is null)
            return Result<OrderDto>.Failure("Order not found.");

        if (!request.IsAdmin)
        {
            var hasUserAccess = order.UserId.HasValue
                && request.RequestingUserId.HasValue
                && request.RequestingUserId.Value != Guid.Empty
                && order.UserId.Value == request.RequestingUserId.Value;

            var hasSessionAccess = !string.IsNullOrWhiteSpace(order.SessionId)
                && !string.IsNullOrWhiteSpace(request.RequestingSessionId)
                && string.Equals(
                    order.SessionId.Trim(),
                    request.RequestingSessionId.Trim(),
                    StringComparison.Ordinal);

            if (!hasUserAccess && !hasSessionAccess)
                return Result<OrderDto>.Failure("You do not have access to this order.");
        }

        return Result<OrderDto>.Success(OrderMappings.ToDto(order));
    }
}
