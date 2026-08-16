using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;

namespace Bymed.Application.Products;

public sealed class ProductSlugGenerator : IProductSlugGenerator
{
    private const string FallbackSlug = "product";

    private readonly IProductRepository _productRepository;

    public ProductSlugGenerator(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public Task<string> GenerateUniqueSlugAsync(
        string name,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default) =>
        UniqueSlugGenerator.GenerateUniqueAsync(
            name,
            Product.SlugMaxLength,
            FallbackSlug,
            (slug, ct) => _productRepository.ExistsSlugAsync(slug, excludeProductId, ct),
            cancellationToken);
}
