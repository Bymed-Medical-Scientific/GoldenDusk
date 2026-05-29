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
    private readonly ICatalogueItemSlugGenerator _slugGenerator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public CreateCatalogueItemCommandHandler(
        ICatalogueItemRepository catalogueItemRepository,
        ICatalogueItemSlugGenerator slugGenerator,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _slugGenerator = slugGenerator ?? throw new ArgumentNullException(nameof(slugGenerator));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result<CatalogueItemDto>> Handle(
        CreateCatalogueItemCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        var slug = await _slugGenerator
            .GenerateUniqueSlugAsync(req.Name, excludeCatalogueItemId: null, cancellationToken)
            .ConfigureAwait(false);

        var item = new CatalogueItem(
            req.Name,
            slug,
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
