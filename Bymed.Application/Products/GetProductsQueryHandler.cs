using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IProductRepository _productRepository;

    public GetProductsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);

        // For now use repository-level category and availability filters.
        // Search filtering can be added later at repository level if needed.
        var pagedProducts = await _productRepository
            .GetPagedAsync(pagination, request.CategoryId, request.InStock, cancellationToken)
            .ConfigureAwait(false);

        var dtoItems = pagedProducts.Items
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                Price = p.Price,
                Currency = p.Currency,
                InventoryCount = p.InventoryCount,
                LowStockThreshold = p.LowStockThreshold,
                IsAvailable = p.IsAvailable,
                Sku = p.Sku,
                Specifications = p.Specifications
            })
            .ToList();

        return new PagedResult<ProductDto>(
            dtoItems,
            pagedProducts.PageNumber,
            pagedProducts.PageSize,
            pagedProducts.TotalCount);
    }
}
