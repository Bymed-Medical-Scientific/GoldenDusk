using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Products;

public sealed class UploadProductImageCommandHandler : IRequestHandler<UploadProductImageCommand, Result<ProductImageDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductImageRepository _productImageRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public UploadProductImageCommandHandler(
        IProductRepository productRepository,
        IProductImageRepository productImageRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<ProductImageDto>> Handle(UploadProductImageCommand request, CancellationToken cancellationToken)
    {
        if (request.FileBytes is null || request.FileBytes.Length == 0)
            return Result<ProductImageDto>.Failure("Image file is required.");

        var product = await _productRepository
            .GetByIdAsync(request.ProductId, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<ProductImageDto>.Failure("Product not found.");

        await using var stream = new MemoryStream(request.FileBytes, writable: false);

        var stored = await _fileStorageService
            .SaveProductImageAsync(stream, request.FileName, request.ContentType, cancellationToken)
            .ConfigureAwait(false);

        if (!stored.IsSuccess || stored.Value is null)
            return Result<ProductImageDto>.Failure(stored.Error ?? "Failed to store image.");

        var altText = string.IsNullOrWhiteSpace(request.AltText)
            ? product.Name
            : request.AltText.Trim();

        var image = new ProductImage(
            product.Id,
            stored.Value.OriginalUrl,
            altText,
            displayOrder: 0);

        _productImageRepository.Add(image);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new ProductImageDto
        {
            Id = image.Id,
            ProductId = image.ProductId,
            Url = image.Url,
            AltText = image.AltText,
            DisplayOrder = image.DisplayOrder
        };

        return Result<ProductImageDto>.Success(dto);
    }
}

