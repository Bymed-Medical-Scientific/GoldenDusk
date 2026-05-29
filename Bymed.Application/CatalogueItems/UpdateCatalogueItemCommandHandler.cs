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
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public UpdateCatalogueItemCommandHandler(
        ICatalogueItemRepository catalogueItemRepository,
        IBrandRepository brandRepository,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
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

        var brandError = await CatalogueBrandValidator
            .ValidateBrandIdAsync(_brandRepository, req.BrandId, cancellationToken)
            .ConfigureAwait(false);
        if (brandError is not null)
            return Result<CatalogueItemDto>.Failure(brandError);

        item.Update(req.Name, req.Description, req.CategoryId, req.BrandId);
        item.SetPublished(req.IsPublished);

        _catalogueItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        item = (await _catalogueItemRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false))!;

        return Result<CatalogueItemDto>.Success(CatalogueItemMapper.ToDto(item));
    }
}
