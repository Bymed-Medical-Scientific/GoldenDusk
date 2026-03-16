using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 16: Product Availability Toggle.
/// When inventory is updated to zero, the product must be marked unavailable.
/// Validates: Requirements 6.4
/// </summary>
public class ProductAvailabilityTogglePropertyTests
{
    private static Product CreateProduct(int initialInventory)
        => new(
            name: "Test Product",
            slug: "test-product",
            description: "Desc",
            categoryId: Guid.NewGuid(),
            price: 10m,
            inventoryCount: initialInventory,
            lowStockThreshold: 1);

    // Feature: bymed-website, Property 16: Product Availability Toggle
    [Property(MaxTest = 100)]
    public Property UpdatingInventoryToZero_MarksProductAsUnavailable()
    {
        var nonNegativeInventory = ArbMap.Default.GeneratorFor<int>()
            .Where(i => i >= 0 && i <= 10_000)
            .ToArbitrary();

        return Prop.ForAll(nonNegativeInventory, initialInventory =>
        {
            var product = CreateProduct(initialInventory);

            product.UpdateInventory(0, reason: "test-zero", changedBy: "tester");

            product.InventoryCount.Should().Be(0);
            product.IsAvailable.Should().BeFalse("product with zero inventory must not be available");
        });
    }
}
