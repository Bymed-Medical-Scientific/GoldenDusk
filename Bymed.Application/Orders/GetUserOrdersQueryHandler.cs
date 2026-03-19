using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class GetUserOrdersQueryHandler : IRequestHandler<GetUserOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;

    public GetUserOrdersQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public async Task<PagedResult<OrderDto>> Handle(GetUserOrdersQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _orderRepository
            .GetPagedAsync(pagination, userId: request.UserId, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        var dtos = paged.Items.Select(OrderMappings.ToDto).ToList();
        return new PagedResult<OrderDto>(dtos, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }
}
