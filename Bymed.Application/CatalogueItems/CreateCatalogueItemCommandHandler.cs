using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class CreateCatalogueItemCommandHandler
    : IRequestHandler<CreateCatalogueItemCommand, Result<CatalogueItemDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public CreateCatalogueItemCommandHandler(
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
        CreateCatalogueItemCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var slugExists = await _catalogueItemRepository
            .ExistsSlugAsync(req.Slug.Trim(), excludeCatalogueItemId: null, cancellationToken)
            .ConfigureAwait(false);
        if (slugExists)
            return Result<CatalogueItemDto>.Failure("A catalogue item with this slug already exists.");

        var item = new CatalogueItem(
            req.Name,
            req.Slug,
            req.Description,
            req.CategoryId,
            req.Brand,
            req.IsPublished);

        _catalogueItemRepository.Add(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new CatalogueItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Slug = item.Slug,
            Description = item.Description,
            CategoryId = item.CategoryId,
            CategoryName = string.Empty,
            IsPublished = item.IsPublished,
            Brand = item.Brand,
        };

        return Result<CatalogueItemDto>.Success(dto);
    }
}
