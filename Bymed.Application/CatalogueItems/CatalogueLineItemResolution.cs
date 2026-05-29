namespace Bymed.Application.CatalogueItems;

public sealed record CatalogueLineItemResolution(
    Guid Id,
    string Name,
    string SkuSnapshot,
    decimal PriceAtAdd,
    bool IsCatalogueItem);
