using Bymed.Application.Categories;
using Bymed.Application.Common;
using Bymed.Application.Products;

namespace Bymed.Application.Caching;

/// <summary>
/// Distributed read-through cache for public catalog data (invalidated on admin catalog changes).
/// </summary>
public interface ICatalogReadCache
{
    Task<PagedResult<ProductDto>?> TryGetProductsAsync(GetProductsQuery query, CancellationToken cancellationToken);

    Task SetProductsAsync(GetProductsQuery query, PagedResult<ProductDto> result, CancellationToken cancellationToken);

    Task<IReadOnlyList<CategoryDto>?> TryGetCategoriesAsync(CancellationToken cancellationToken);

    Task SetCategoriesAsync(IReadOnlyList<CategoryDto> categories, CancellationToken cancellationToken);

    /// <summary>Bump catalog version so all catalog keys miss on next read.</summary>
    Task InvalidateAsync(CancellationToken cancellationToken);
}
