using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class UpdateCatalogueItemCommandHandler
    : IRequestHandler<UpdateCatalogueItemCommand, Result<CatalogueItemDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public UpdateCatalogueItemCommandHandler(
        ICatalogueItemRepository catalogueItemRepository,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result<CatalogueItemDto>> Handle(
        UpdateCatalogueItemCommand request,
        CancellationToken cancellationToken)
    {
        var item = await _catalogueItemRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (item is null)
            return Result<CatalogueItemDto>.Failure("Catalogue item not found.");

        var req = request.Request;
        var slugExists = await _catalogueItemRepository
            .ExistsSlugAsync(req.Slug.Trim(), excludeCatalogueItemId: request.Id, cancellationToken)
            .ConfigureAwait(false);
        if (slugExists)
            return Result<CatalogueItemDto>.Failure("A catalogue item with this slug already exists.");

        item.Update(req.Name, req.Slug, req.Description, req.CategoryId, req.Sku, req.Brand);
        item.SetPublished(req.IsPublished);

        _catalogueItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new CatalogueItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Slug = item.Slug,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CategoryName = item.Category.Name,
            IsPublished = item.IsPublished,
            Sku = item.Sku,
            Brand = item.Brand,
        };

        return Result<CatalogueItemDto>.Success(dto);
    }
}
