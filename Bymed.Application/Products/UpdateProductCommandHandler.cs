using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public UpdateProductCommandHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<ProductDto>.Failure("Product not found.");

        var req = request.Request;
        var slugExists = await _productRepository
            .ExistsSlugAsync(req.Slug.Trim(), excludeProductId: request.Id, cancellationToken)
            .ConfigureAwait(false);
        if (slugExists)
            return Result<ProductDto>.Failure("A product with this slug already exists.");

        product.Update(
            req.Name,
            req.Slug,
            req.Description,
            req.CategoryId,
            req.Price,
            req.LowStockThreshold,
            req.Sku,
            req.Specifications);

        _productRepository.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            Price = product.Price,
            Currency = product.Currency,
            InventoryCount = product.InventoryCount,
            LowStockThreshold = product.LowStockThreshold,
            IsAvailable = product.IsAvailable,
            Sku = product.Sku,
            Specifications = product.Specifications
        };

        return Result<ProductDto>.Success(dto);
    }
}
