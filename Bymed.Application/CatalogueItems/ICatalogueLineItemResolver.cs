namespace Bymed.Application.CatalogueItems;

public interface ICatalogueLineItemResolver
{
    Task<CatalogueLineItemResolution?> ResolveAsync(Guid lineItemId, CancellationToken cancellationToken = default);
}
