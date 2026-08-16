using Bymed.Application.CatalogueItems;
using Bymed.Application.Common;

namespace Bymed.Application.Caching;

public interface ICatalogueReadCache
{
    Task<PagedResult<CatalogueItemDto>?> TryGetCatalogueItemsAsync(
        GetCatalogueItemsQuery query,
        CancellationToken cancellationToken);

    Task SetCatalogueItemsAsync(
        GetCatalogueItemsQuery query,
        PagedResult<CatalogueItemDto> result,
        CancellationToken cancellationToken);

    Task InvalidateAsync(CancellationToken cancellationToken);
}
