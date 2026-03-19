using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Products;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using System.Reflection;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 15: Product CRUD Operations.
/// For product create, read, update, and delete operations, handlers must
/// correctly call repositories and respect basic invariants.
/// Validates: Requirements 6.2, 6.3, 6.6
/// </summary>
public class ProductCrudPropertyTests
{
    private static IProductRepository CreateProductRepository() => Substitute.For<IProductRepository>();
    private static IUnitOfWork CreateUnitOfWork() => Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateProductCommand_WhenSlugUnique_CreatesAndReturnsDto()
    {
        var repo = CreateProductRepository();
        repo.ExistsSlugAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var request = new CreateProductRequest
        {
            Name = "Infusion Pump",
            Slug = "infusion-pump",
            Description = "High-precision infusion pump",
            CategoryId = Guid.NewGuid(),
            Price = 1000m,
            InventoryCount = 10,
            LowStockThreshold = 2,
            Sku = "SKU-123",
            Currency = "USD",
            Specifications = new Dictionary<string, string> { ["flow-rate"] = "0.1-1200 ml/h" }
        };

        var handler = new CreateProductCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new CreateProductCommand(request), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Infusion Pump");
        result.Value.Slug.Should().Be("infusion-pump");
        unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        repo.Received(1).Add(Arg.Any<Product>());
    }

    [Fact]
    public async Task UpdateProductCommand_WhenExistsAndSlugUnique_UpdatesAndReturnsDto()
    {
        var id = Guid.NewGuid();
        var existing = new Product(
            "Old Name",
            "old-slug",
            "Old description",
            Guid.NewGuid(),
            500m,
            inventoryCount: 5,
            lowStockThreshold: 1);

        // Handlers rely on the Category navigation when constructing DTOs.
        // Tests create Product instances directly, so we wire the navigation via reflection.
        var category = new Category("Test Category", "test-category", null, displayOrder: 0);
        SetProductCategoryNavigation(existing, category);

        var repo = CreateProductRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(existing);
        repo.ExistsSlugAsync(Arg.Any<string>(), id, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var request = new UpdateProductRequest
        {
            Name = "Updated Name",
            Slug = "updated-slug",
            Description = "Updated description",
            CategoryId = Guid.NewGuid(),
            Price = 750m,
            LowStockThreshold = 3,
            Sku = "SKU-456",
            Specifications = new Dictionary<string, string> { ["updated"] = "true" }
        };

        var handler = new UpdateProductCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new UpdateProductCommand(id, request), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Updated Name");
        result.Value.Slug.Should().Be("updated-slug");
        existing.Name.Should().Be("Updated Name");
        existing.Slug.Should().Be("updated-slug");
        repo.Received(1).Update(existing);
        unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private static void SetProductCategoryNavigation(Product product, Category category)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(category);

        var prop = typeof(Product).GetProperty(
            "Category",
            BindingFlags.Instance | BindingFlags.Public);

        prop.Should().NotBeNull();
        prop!.SetValue(product, category);
    }

    [Fact]
    public async Task DeleteProductCommand_WhenExists_MarksUnavailableAndSaves()
    {
        var id = Guid.NewGuid();
        var product = new Product(
            "To Delete",
            "to-delete",
            "Desc",
            Guid.NewGuid(),
            100m,
            inventoryCount: 1,
            lowStockThreshold: 0);

        var repo = CreateProductRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(product);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var handler = new DeleteProductCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new DeleteProductCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        product.IsAvailable.Should().BeFalse();
        repo.Received(1).Update(product);
        unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
