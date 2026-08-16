using Bymed.Application.Repositories;

namespace Bymed.Application.CatalogueItems;

public sealed class CatalogueLineItemResolver : ICatalogueLineItemResolver
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly IProductRepository _productRepository;

    public CatalogueLineItemResolver(
        ICatalogueItemRepository catalogueItemRepository,
        IProductRepository productRepository)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public async Task<CatalogueLineItemResolution?> ResolveAsync(
        Guid lineItemId,
        CancellationToken cancellationToken = default)
    {
        var catalogueItem = await _catalogueItemRepository
            .GetByIdAsync(lineItemId, cancellationToken)
            .ConfigureAwait(false);

        if (catalogueItem is not null)
        {
            if (!catalogueItem.IsPublished)
                return null;

            return new CatalogueLineItemResolution(
                catalogueItem.Id,
                catalogueItem.Name,
                SkuSnapshot: string.Empty,
                PriceAtAdd: 0m,
                IsCatalogueItem: true);
        }

        var product = await _productRepository
            .GetByIdAsync(lineItemId, cancellationToken)
            .ConfigureAwait(false);

        if (product is null || !product.IsAvailable)
            return null;

        return new CatalogueLineItemResolution(
            product.Id,
            product.Name,
            product.Sku ?? string.Empty,
            product.Price,
            IsCatalogueItem: false);
    }
}
