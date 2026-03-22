using Bymed.Application.Caching;
using Bymed.Application.Categories;
using Bymed.Application.Common;
using Bymed.Application.Products;
using NSubstitute;

namespace Bymed.Tests;

internal static class TestCatalogCacheHelper
{
    /// <summary>Substitute that never hits cache and ignores invalidation.</summary>
    public static ICatalogReadCache Create()
    {
        var cache = Substitute.For<ICatalogReadCache>();
        cache.TryGetProductsAsync(Arg.Any<GetProductsQuery>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<PagedResult<ProductDto>?>(null));
        cache.TryGetCategoriesAsync(Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<IReadOnlyList<CategoryDto>?>(null));
        cache.SetProductsAsync(Arg.Any<GetProductsQuery>(), Arg.Any<PagedResult<ProductDto>>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        cache.SetCategoriesAsync(Arg.Any<IReadOnlyList<CategoryDto>>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        cache.InvalidateAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        return cache;
    }
}
