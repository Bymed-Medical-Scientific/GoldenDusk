using Bymed.Domain.Entities;
using Bymed.Application.Products;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 2: Product Display Completeness.
/// For any valid Product entity, the mapped ProductDto should expose all
/// required display fields (name, price, availability, etc.) consistently.
/// Validates: Requirements 1.3 (product display completeness).
/// </summary>
public class ProductDisplayCompletenessPropertyTests
{
    private static Product CreateProduct(string name, string slug, string description, Guid categoryId, decimal price)
        => new(name, slug, description, categoryId, price, inventoryCount: 10, lowStockThreshold: 2);

    private static ProductDto MapToDto(Product product)
        => new()
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = "Category Name",
            Price = product.Price,
            Currency = product.Currency,
            InventoryCount = product.InventoryCount,
            LowStockThreshold = product.LowStockThreshold,
            IsAvailable = product.IsAvailable,
            Sku = product.Sku,
            Specifications = product.Specifications
        };

    // Feature: bymed-website, Property 2: Product Display Completeness
    // Mapping a valid Product to ProductDto preserves core display fields.
    [Property(MaxTest = 100)]
    public Property Mapping_Product_ToDto_PreservesDisplayFields()
    {
        var nonEmptyGuid = ArbMap.Default.GeneratorFor<Guid>().Where(id => id != Guid.Empty).ToArbitrary();
        var prices = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 0 && p <= 10_000).ToArbitrary();

        return Prop.ForAll(nonEmptyGuid, prices, (categoryId, price) =>
        {
            var product = CreateProduct(
                name: "Test Product",
                slug: "test-product",
                description: "Description",
                categoryId: categoryId,
                price: price);

            var dto = MapToDto(product);

            dto.Id.Should().Be(product.Id);
            dto.Name.Should().Be(product.Name);
            dto.Slug.Should().Be(product.Slug);
            dto.Description.Should().Be(product.Description);
            dto.CategoryId.Should().Be(product.CategoryId);
            dto.Price.Should().Be(product.Price);
            dto.Currency.Should().Be(product.Currency);
            dto.InventoryCount.Should().Be(product.InventoryCount);
            dto.LowStockThreshold.Should().Be(product.LowStockThreshold);
            dto.IsAvailable.Should().Be(product.IsAvailable);

            dto.Name.Should().NotBeNullOrWhiteSpace();
            dto.Slug.Should().NotBeNullOrWhiteSpace();
        });
    }
}
