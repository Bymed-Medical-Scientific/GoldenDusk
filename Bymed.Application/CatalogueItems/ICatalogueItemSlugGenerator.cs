namespace Bymed.Application.CatalogueItems;

public interface ICatalogueItemSlugGenerator
{
    Task<string> GenerateUniqueSlugAsync(
        string name,
        Guid? excludeCatalogueItemId = null,
        CancellationToken cancellationToken = default);
}
