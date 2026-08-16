using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class DeleteCatalogueItemImageCommandHandler
    : IRequestHandler<DeleteCatalogueItemImageCommand, Result>
{
    private readonly ICatalogueItemImageRepository _catalogueItemImageRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public DeleteCatalogueItemImageCommandHandler(
        ICatalogueItemImageRepository catalogueItemImageRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemImageRepository = catalogueItemImageRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemImageRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result> Handle(DeleteCatalogueItemImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _catalogueItemImageRepository
            .GetByIdAsync(request.ImageId, cancellationToken)
            .ConfigureAwait(false);

        if (image is null || image.CatalogueItemId != request.CatalogueItemId)
            return Result.Failure("Catalogue item image not found.");

        var deleteResult = await _fileStorageService
            .DeleteFileAsync(image.Url, cancellationToken)
            .ConfigureAwait(false);

        if (!deleteResult.IsSuccess)
            return Result.Failure(deleteResult.Error ?? "Failed to delete image file.");

        _catalogueItemImageRepository.Remove(image);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
