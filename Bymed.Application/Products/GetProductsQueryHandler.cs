using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductImageRepository _productImageRepository;
    private readonly ICatalogReadCache _catalogCache;

    public GetProductsQueryHandler(
        IProductRepository productRepository,
        IProductImageRepository productImageRepository,
        ICatalogReadCache catalogCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
        _catalogCache = catalogCache ?? throw new ArgumentNullException(nameof(catalogCache));
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var cached = await _catalogCache
            .TryGetProductsAsync(request, cancellationToken)
            .ConfigureAwait(false);
        if (cached is not null)
            return cached;

        var pagination = new PaginationParams(request.PageNumber, request.PageSize);

        // For now use repository-level category and availability filters.
        // Search filtering can be added later at repository level if needed.
        var pagedProducts = await _productRepository
            .GetPagedAsync(
                pagination,
                request.CategoryId,
                request.InStock,
                request.Brand,
                request.Search,
                cancellationToken)
            .ConfigureAwait(false);

        var productIds = pagedProducts.Items.Select(p => p.Id).ToList();
        var primaryImageUrls = await _productImageRepository
            .GetPrimaryImageUrlsByProductIdsAsync(productIds, cancellationToken)
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
                PrimaryImageUrl = primaryImageUrls.TryGetValue(p.Id, out var url) ? url : null,
                Price = p.Price,
                Currency = p.Currency,
                InventoryCount = p.InventoryCount,
                LowStockThreshold = p.LowStockThreshold,
                IsAvailable = p.IsAvailable,
                Sku = p.Sku,
                Specifications = p.Specifications
            })
            .ToList();

        var result = new PagedResult<ProductDto>(
            dtoItems,
            pagedProducts.PageNumber,
            pagedProducts.PageSize,
            pagedProducts.TotalCount);

        await _catalogCache.SetProductsAsync(request, result, cancellationToken).ConfigureAwait(false);

        return result;
    }
}
