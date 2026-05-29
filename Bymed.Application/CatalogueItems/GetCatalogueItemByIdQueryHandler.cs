using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class GetCatalogueItemByIdQueryHandler
    : IRequestHandler<GetCatalogueItemByIdQuery, Result<CatalogueItemDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly ICatalogueItemImageRepository _catalogueItemImageRepository;

    public GetCatalogueItemByIdQueryHandler(
        ICatalogueItemRepository catalogueItemRepository,
        ICatalogueItemImageRepository catalogueItemImageRepository)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _catalogueItemImageRepository = catalogueItemImageRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemImageRepository));
    }

    public async Task<Result<CatalogueItemDto>> Handle(
        GetCatalogueItemByIdQuery request,
        CancellationToken cancellationToken)
    {
        var item = await _catalogueItemRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (item is null)
            return Result<CatalogueItemDto>.Failure("Catalogue item not found.");

        var images = await _catalogueItemImageRepository
            .GetByCatalogueItemIdAsync(item.Id, cancellationToken)
            .ConfigureAwait(false);

        var imageDtos = images
            .Select(i => new CatalogueItemImageDto
            {
                Id = i.Id,
                CatalogueItemId = i.CatalogueItemId,
                Url = i.Url,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
            })
            .ToList();

        return Result<CatalogueItemDto>.Success(CatalogueItemMapper.ToDto(item, images: imageDtos));
    }
}
