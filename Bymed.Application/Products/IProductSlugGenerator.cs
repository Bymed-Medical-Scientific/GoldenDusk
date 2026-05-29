namespace Bymed.Application.Products;

public interface IProductSlugGenerator
{
    Task<string> GenerateUniqueSlugAsync(
        string name,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default);
}
