using Bymed.Domain.Entities;
using Bymed.Domain.Events;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 17: Product Changes Propagation.
/// Updating inventory should raise InventoryChangedEvent, and going to zero
/// should also raise ProductOutOfStockEvent.
/// Validates: Requirements 6.5
/// </summary>
public class ProductChangesPropagationPropertyTests
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

    // Feature: bymed-website, Property 17: Product Changes Propagation
    [Property(MaxTest = 100)]
    public Property UpdateInventory_RaisesInventoryChangedEvent_WithCorrectPayload()
    {
        var counts = ArbMap.Default.GeneratorFor<(int previous, int next)>()
            .Where(tuple => tuple.previous >= 0 && tuple.next >= 0 && tuple.previous <= 10_000 && tuple.next <= 10_000)
            .ToArbitrary();

        return Prop.ForAll(counts, tuple =>
        {
            var (previous, next) = tuple;
            var product = CreateProduct(previous);

            product.UpdateInventory(next, reason: "adjustment", changedBy: "tester");

            var events = product.DomainEvents.OfType<InventoryChangedEvent>().ToList();
            events.Should().NotBeEmpty();
            var evt = events.Last();

            evt.PreviousCount.Should().Be(previous);
            evt.NewCount.Should().Be(next);
            evt.ProductId.Should().Be(product.Id);
            evt.Reason.Should().Be("adjustment");
            evt.ChangedBy.Should().Be("tester");
        });
    }

    // Feature: bymed-website, Property 17: Product Changes Propagation (out-of-stock)
    [Property(MaxTest = 100)]
    public Property UpdateInventoryToZero_RaisesProductOutOfStockEvent()
    {
        var positiveCounts = ArbMap.Default.GeneratorFor<int>()
            .Where(c => c > 0 && c <= 10_000)
            .ToArbitrary();

        return Prop.ForAll(positiveCounts, initial =>
        {
            var product = CreateProduct(initial);

            product.UpdateInventory(0, reason: "sold-out", changedBy: "tester");

            var evt = product.DomainEvents.OfType<ProductOutOfStockEvent>().LastOrDefault();
            evt.Should().NotBeNull("zero inventory must emit out-of-stock event");
            evt!.ProductId.Should().Be(product.Id);
            evt.ProductName.Should().Be(product.Name);
            evt.Sku.Should().Be(product.Sku);
        });
    }
}
