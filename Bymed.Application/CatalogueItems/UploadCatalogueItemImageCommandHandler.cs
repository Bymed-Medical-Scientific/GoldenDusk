using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class UploadCatalogueItemImageCommandHandler
    : IRequestHandler<UploadCatalogueItemImageCommand, Result<CatalogueItemImageDto>>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly ICatalogueItemImageRepository _catalogueItemImageRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public UploadCatalogueItemImageCommandHandler(
        ICatalogueItemRepository catalogueItemRepository,
        ICatalogueItemImageRepository catalogueItemImageRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _catalogueItemImageRepository = catalogueItemImageRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemImageRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result<CatalogueItemImageDto>> Handle(
        UploadCatalogueItemImageCommand request,
        CancellationToken cancellationToken)
    {
        if (request.FileBytes is null || request.FileBytes.Length == 0)
            return Result<CatalogueItemImageDto>.Failure("Image file is required.");

        var item = await _catalogueItemRepository
            .GetByIdAsync(request.CatalogueItemId, cancellationToken)
            .ConfigureAwait(false);

        if (item is null)
            return Result<CatalogueItemImageDto>.Failure("Catalogue item not found.");

        await using var stream = new MemoryStream(request.FileBytes, writable: false);

        var stored = await _fileStorageService
            .SaveProductImageAsync(stream, request.FileName, request.ContentType, cancellationToken)
            .ConfigureAwait(false);

        if (!stored.IsSuccess || stored.Value is null)
            return Result<CatalogueItemImageDto>.Failure(stored.Error ?? "Failed to store image.");

        var altText = string.IsNullOrWhiteSpace(request.AltText)
            ? item.Name
            : request.AltText.Trim();

        var image = new CatalogueItemImage(
            item.Id,
            stored.Value.OriginalUrl,
            altText,
            displayOrder: 0);

        _catalogueItemImageRepository.Add(image);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new CatalogueItemImageDto
        {
            Id = image.Id,
            CatalogueItemId = image.CatalogueItemId,
            Url = image.Url,
            AltText = image.AltText,
            DisplayOrder = image.DisplayOrder,
        };

        return Result<CatalogueItemImageDto>.Success(dto);
    }
}
