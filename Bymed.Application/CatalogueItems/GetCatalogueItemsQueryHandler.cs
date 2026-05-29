using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class GetCatalogueItemsQueryHandler
    : IRequestHandler<GetCatalogueItemsQuery, PagedResult<CatalogueItemDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly ICatalogueItemImageRepository _catalogueItemImageRepository;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public GetCatalogueItemsQueryHandler(
        ICatalogueItemRepository catalogueItemRepository,
        ICatalogueItemImageRepository catalogueItemImageRepository,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _catalogueItemImageRepository = catalogueItemImageRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemImageRepository));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<PagedResult<CatalogueItemDto>> Handle(
        GetCatalogueItemsQuery request,
        CancellationToken cancellationToken)
    {
        var cached = await _catalogueReadCache
            .TryGetCatalogueItemsAsync(request, cancellationToken)
            .ConfigureAwait(false);
        if (cached is not null)
            return cached;

        var pagination = new PaginationParams(request.PageNumber, request.PageSize);

        var paged = await _catalogueItemRepository
            .GetPagedAsync(
                pagination,
                request.CategoryId,
                request.IsPublished,
                request.Brand,
                request.Search,
                cancellationToken)
            .ConfigureAwait(false);

        var ids = paged.Items.Select(c => c.Id).ToList();
        var primaryImageUrls = await _catalogueItemImageRepository
            .GetPrimaryImageUrlsByCatalogueItemIdsAsync(ids, cancellationToken)
            .ConfigureAwait(false);

        var dtoItems = paged.Items
            .Select(c => new CatalogueItemDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                CategoryId = c.CategoryId,
                CategoryName = c.Category.Name,
                PrimaryImageUrl = primaryImageUrls.TryGetValue(c.Id, out var url) ? url : null,
                IsPublished = c.IsPublished,
                Brand = c.Brand,
            })
            .ToList();

        var result = new PagedResult<CatalogueItemDto>(
            dtoItems,
            paged.PageNumber,
            paged.PageSize,
            paged.TotalCount);

        await _catalogueReadCache.SetCatalogueItemsAsync(request, result, cancellationToken).ConfigureAwait(false);

        return result;
    }
}
