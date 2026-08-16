using Bymed.Application.CatalogueItems;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using NSubstitute;

namespace Bymed.Tests;

internal static class TestCatalogueLineItemResolverHelper
{
    /// <summary>Resolver that only resolves products (no catalogue rows in unit tests).</summary>
    public static ICatalogueLineItemResolver ForProductsOnly(IProductRepository productRepository)
    {
        var catalogueRepository = Substitute.For<ICatalogueItemRepository>();
        catalogueRepository
            .GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<CatalogueItem?>(null));
        return new CatalogueLineItemResolver(catalogueRepository, productRepository);
    }
}
