using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;

    public GetAllOrdersQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public async Task<PagedResult<OrderDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _orderRepository
            .GetPagedAsync(
                pagination,
                userId: null,
                status: request.Status,
                dateFrom: request.DateFrom,
                dateTo: request.DateTo,
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        var dtos = paged.Items.Select(OrderMappings.ToDto).ToList();
        return new PagedResult<OrderDto>(dtos, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }
}
