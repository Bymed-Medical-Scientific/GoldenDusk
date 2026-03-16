using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Result>
{
    private readonly IProductImageRepository _productImageRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProductImageCommandHandler(
        IProductImageRepository productImageRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork)
    {
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _productImageRepository
            .GetByIdAsync(request.ImageId, cancellationToken)
            .ConfigureAwait(false);

        if (image is null || image.ProductId != request.ProductId)
            return Result.Failure("Product image not found.");

        var deleteResult = await _fileStorageService
            .DeleteFileAsync(image.Url, cancellationToken)
            .ConfigureAwait(false);

        if (!deleteResult.IsSuccess)
            return Result.Failure(deleteResult.Error ?? "Failed to delete image file.");

        _productImageRepository.Remove(image);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}

