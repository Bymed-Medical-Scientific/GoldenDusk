using Bymed.Application.Caching;
using Bymed.Application.CatalogueItems;
using Bymed.Application.Common;
using NSubstitute;

namespace Bymed.Tests;

internal static class TestCatalogueReadCacheHelper
{
    public static ICatalogueReadCache Create()
    {
        var cache = Substitute.For<ICatalogueReadCache>();
        cache.TryGetCatalogueItemsAsync(Arg.Any<GetCatalogueItemsQuery>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<PagedResult<CatalogueItemDto>?>(null));
        cache.SetCatalogueItemsAsync(
                Arg.Any<GetCatalogueItemsQuery>(),
                Arg.Any<PagedResult<CatalogueItemDto>>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        cache.InvalidateAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        return cache;
    }
}
