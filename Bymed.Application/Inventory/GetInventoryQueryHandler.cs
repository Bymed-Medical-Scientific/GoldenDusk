using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed class GetInventoryQueryHandler : IRequestHandler<GetInventoryQuery, PagedResult<InventoryDto>>
{
    private readonly IProductRepository _productRepository;

    public GetInventoryQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public async Task<PagedResult<InventoryDto>> Handle(GetInventoryQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var pagedProducts = await _productRepository
            .GetInventoryPagedAsync(pagination, request.LowStockOnly, request.Search, cancellationToken)
            .ConfigureAwait(false);

        var items = pagedProducts.Items
            .Select(product => new InventoryDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Sku = product.Sku,
                InventoryCount = product.InventoryCount,
                LowStockThreshold = product.LowStockThreshold,
                IsAvailable = product.IsAvailable
            })
            .ToList();

        return new PagedResult<InventoryDto>(items, pagedProducts.PageNumber, pagedProducts.PageSize, pagedProducts.TotalCount);
    }
}
