using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductImageRepository _productImageRepository;

    public GetProductByIdQueryHandler(
        IProductRepository productRepository,
        IProductImageRepository productImageRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<ProductDto>.Failure("Product not found.");

        var images = await _productImageRepository
            .GetByProductIdAsync(product.Id, cancellationToken)
            .ConfigureAwait(false);

        var imageDtos = images
            .Select(i => new ProductImageDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                Url = i.Url,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder
            })
            .ToList();

        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            PrimaryImageUrl = imageDtos.FirstOrDefault()?.Url,
            Images = imageDtos,
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
