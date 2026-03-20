using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed class GetLowStockProductsQueryHandler : IRequestHandler<GetLowStockProductsQuery, IReadOnlyList<InventoryDto>>
{
    private readonly IProductRepository _productRepository;

    public GetLowStockProductsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public async Task<IReadOnlyList<InventoryDto>> Handle(GetLowStockProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _productRepository.GetLowStockProductsAsync(cancellationToken).ConfigureAwait(false);
        return products
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
    }
}
