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
        item.Update(req.Name, req.Description, req.CategoryId, req.Brand);
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
            Brand = item.Brand,
        };

        return Result<CatalogueItemDto>.Success(dto);
    }
}
