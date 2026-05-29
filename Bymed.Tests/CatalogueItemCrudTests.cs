using Bymed.Application.Carts;
using Bymed.Application.CatalogueItems;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Bymed.Tests;

public class CatalogueItemCrudTests
{
    private static ICatalogueItemRepository CreateRepository() => Substitute.For<ICatalogueItemRepository>();
    private static IUnitOfWork CreateUnitOfWork() => Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateCatalogueItemCommand_WhenSlugUnique_CreatesDto()
    {
        var repo = CreateRepository();
        repo.ExistsSlugAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var request = new CreateCatalogueItemRequest
        {
            Name = "Lab Microscope",
            Slug = "lab-microscope",
            Description = "Precision microscope",
            CategoryId = Guid.NewGuid(),
            Brand = "OptiLab",
            IsPublished = true,
        };

        var handler = new CreateCatalogueItemCommandHandler(
            repo,
            unitOfWork,
            TestCatalogueReadCacheHelper.Create());
        var result = await handler.Handle(new CreateCatalogueItemCommand(request), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("Lab Microscope");
        result.Value.Slug.Should().Be("lab-microscope");
        repo.Received(1).Add(Arg.Any<CatalogueItem>());
    }

    [Fact]
    public async Task CatalogueLineItemResolver_WhenCataloguePublished_ReturnsZeroPrice()
    {
        var itemId = Guid.NewGuid();
        var catalogueItem = new CatalogueItem(
            "Catalogue Only",
            "catalogue-only",
            "Description",
            Guid.NewGuid(),
            isPublished: true);

        var catalogueRepo = CreateRepository();
        catalogueRepo.GetByIdAsync(itemId, Arg.Any<CancellationToken>()).Returns(catalogueItem);

        var productRepo = Substitute.For<IProductRepository>();
        var resolver = new CatalogueLineItemResolver(catalogueRepo, productRepo);

        var resolution = await resolver.ResolveAsync(itemId, CancellationToken.None);

        resolution.Should().NotBeNull();
        resolution!.IsCatalogueItem.Should().BeTrue();
        resolution.PriceAtAdd.Should().Be(0m);
        resolution.Name.Should().Be("Catalogue Only");
    }

    [Fact]
    public async Task AddToCartCommandHandler_WithCatalogueItem_UsesZeroPrice()
    {
        var catalogueItem = new CatalogueItem(
            "RFQ Item",
            "rfq-item",
            "Desc",
            Guid.NewGuid(),
            isPublished: true);
        var itemId = catalogueItem.Id;

        var catalogueRepo = CreateRepository();
        catalogueRepo.GetByIdAsync(itemId, Arg.Any<CancellationToken>()).Returns(catalogueItem);

        var productRepo = Substitute.For<IProductRepository>();
        var resolver = new CatalogueLineItemResolver(catalogueRepo, productRepo);

        var cartRepo = Substitute.For<ICartRepository>();
        cartRepo.GetByUserIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Cart?)null);

        var uow = CreateUnitOfWork();
        uow.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var handler = new AddToCartCommandHandler(cartRepo, resolver, uow);
        var userId = Guid.NewGuid();
        var result = await handler.Handle(
            new AddToCartCommand(userId, null, new AddToCartRequest { ProductId = itemId, Quantity = 2 }),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        cartRepo.Received(1).Add(Arg.Is<Cart>(c =>
            c.Items.Any(i => i.ProductId == itemId && i.PriceAtAdd == 0m && i.Quantity == 2)));
    }

}
