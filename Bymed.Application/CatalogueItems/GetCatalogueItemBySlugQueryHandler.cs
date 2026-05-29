using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class GetCatalogueItemBySlugQueryHandler
    : IRequestHandler<GetCatalogueItemBySlugQuery, Result<CatalogueItemDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly ICatalogueItemImageRepository _catalogueItemImageRepository;

    public GetCatalogueItemBySlugQueryHandler(
        ICatalogueItemRepository catalogueItemRepository,
        ICatalogueItemImageRepository catalogueItemImageRepository)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _catalogueItemImageRepository = catalogueItemImageRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemImageRepository));
    }

    public async Task<Result<CatalogueItemDto>> Handle(
        GetCatalogueItemBySlugQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<CatalogueItemDto>.Failure("Catalogue item not found.");

        var item = await _catalogueItemRepository
            .GetBySlugAsync(request.Slug, cancellationToken)
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

        var dto = new CatalogueItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Slug = item.Slug,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CategoryName = item.Category.Name,
            PrimaryImageUrl = imageDtos.FirstOrDefault()?.Url,
            Images = imageDtos,
            IsPublished = item.IsPublished,
            Brand = item.Brand,
        };

        return Result<CatalogueItemDto>.Success(dto);
    }
}
