using Bymed.Application.Common;
using Bymed.Application.Inventory;
using Bymed.Application.Orders;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Domain.ValueObjects;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Properties 25-28: Inventory tracking behavior.
/// Validates requirements 9.2, 9.3, 9.4, and 9.5.
/// </summary>
public class InventoryTrackingPropertyTests
{
    // Feature: bymed-website, Property 25: Inventory Decrement on Order
    [Property(MaxTest = 30)]
    public Property InventoryDecrementOnOrder_WhenOrderCompletes()
    {
        var initialGen = ArbMap.Default.GeneratorFor<int>().Where(i => i >= 2 && i <= 200);
        var qtyGen = ArbMap.Default.GeneratorFor<int>().Where(q => q >= 1 && q <= 50);
        var scenarioArb = (from initial in initialGen
            from qty in qtyGen
            where qty < initial
            select new { Initial = initial, Quantity = qty }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var db = sp.GetRequiredService<ApplicationDbContext>();
            var productId = SeedProduct(db, 20m, s.Initial, lowStockThreshold: 3);

            var order = CreateOrderWithSingleItem(sp, productId, s.Quantity, "inv-dec");
            var handler = CreateStatusHandler(sp);

            handler.Handle(
                new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Processing }),
                CancellationToken.None).GetAwaiter().GetResult().IsSuccess.Should().BeTrue();
            handler.Handle(
                new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Shipped }),
                CancellationToken.None).GetAwaiter().GetResult().IsSuccess.Should().BeTrue();
            var delivered = handler.Handle(
                new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Delivered }),
                CancellationToken.None).GetAwaiter().GetResult();
            delivered.IsSuccess.Should().BeTrue(delivered.Error);

            var updatedProduct = sp.GetRequiredService<IProductRepository>()
                .GetByIdAsync(productId, CancellationToken.None).GetAwaiter().GetResult();
            updatedProduct.Should().NotBeNull();
            updatedProduct!.InventoryCount.Should().Be(s.Initial - s.Quantity);

            return true;
        });
    }

    // Feature: bymed-website, Property 26: Out of Stock Marking
    [Property(MaxTest = 25)]
    public Property OutOfStockMarking_WhenInventoryReachesZeroOnCompletion()
    {
        var initialGen = ArbMap.Default.GeneratorFor<int>().Where(i => i >= 1 && i <= 100);
        return Prop.ForAll(initialGen.ToArbitrary(), initial =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var db = sp.GetRequiredService<ApplicationDbContext>();
            var productId = SeedProduct(db, 25m, initial, lowStockThreshold: 2);

            var order = CreateOrderWithSingleItem(sp, productId, initial, "oos");
            var handler = CreateStatusHandler(sp);
            handler.Handle(new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Processing }), CancellationToken.None).GetAwaiter().GetResult();
            handler.Handle(new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Shipped }), CancellationToken.None).GetAwaiter().GetResult();
            var delivered = handler.Handle(new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Delivered }), CancellationToken.None).GetAwaiter().GetResult();
            delivered.IsSuccess.Should().BeTrue(delivered.Error);

            var updatedProduct = sp.GetRequiredService<IProductRepository>()
                .GetByIdAsync(productId, CancellationToken.None).GetAwaiter().GetResult();
            updatedProduct.Should().NotBeNull();
            updatedProduct!.InventoryCount.Should().Be(0);
            updatedProduct.IsAvailable.Should().BeFalse();
            return true;
        });
    }

    // Feature: bymed-website, Property 27: Low Stock Alerts
    [Property(MaxTest = 30)]
    public Property LowStockAlerts_QueryReturnsLowStockProductsOnly()
    {
        var lowInvGen = ArbMap.Default.GeneratorFor<int>().Where(i => i >= 0 && i <= 5);
        var thresholdGen = ArbMap.Default.GeneratorFor<int>().Where(t => t >= 1 && t <= 10);
        var scenarioArb = (from lowInv in lowInvGen
            from threshold in thresholdGen
            where lowInv <= threshold
            select new { LowInv = lowInv, Threshold = threshold }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var db = sp.GetRequiredService<ApplicationDbContext>();

            var lowStockProductId = SeedProduct(db, 10m, s.LowInv, s.Threshold);
            var healthyProductId = SeedProduct(db, 10m, s.Threshold + 5, s.Threshold);

            var handler = new GetLowStockProductsQueryHandler(sp.GetRequiredService<IProductRepository>());
            var result = handler.Handle(new GetLowStockProductsQuery(), CancellationToken.None).GetAwaiter().GetResult();

            result.Should().Contain(p => p.ProductId == lowStockProductId);
            result.Should().NotContain(p => p.ProductId == healthyProductId);
            return true;
        });
    }

    // Feature: bymed-website, Property 28: Inventory Adjustment Logging
    [Property(MaxTest = 30)]
    public Property InventoryAdjustmentLogging_ManualAdjustmentsArePersisted()
    {
        var initialGen = ArbMap.Default.GeneratorFor<int>().Where(i => i >= 1 && i <= 150);
        var deltaGen = ArbMap.Default.GeneratorFor<int>().Where(d => d >= -150 && d <= 150 && d != 0);
        var scenarioArb = (from initial in initialGen
            from delta in deltaGen
            where initial + delta >= 0
            select new { Initial = initial, Delta = delta }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var db = sp.GetRequiredService<ApplicationDbContext>();
            var productId = SeedProduct(db, 15m, s.Initial, lowStockThreshold: 2);

            var handler = new AdjustInventoryCommandHandler(
                sp.GetRequiredService<IProductRepository>(),
                sp.GetRequiredService<IInventoryLogRepository>(),
                sp.GetRequiredService<IUnitOfWork>());

            var reason = $"manual-adjust-{Guid.NewGuid():N}";
            var changedBy = "inventory-admin@test.local";
            var result = handler.Handle(
                new AdjustInventoryCommand(productId, new AdjustInventoryRequest
                {
                    Adjustment = s.Delta,
                    Reason = reason
                }, changedBy),
                CancellationToken.None).GetAwaiter().GetResult();

            result.IsSuccess.Should().BeTrue(result.Error);
            result.Value!.InventoryCount.Should().Be(s.Initial + s.Delta);

            var logs = sp.GetRequiredService<IInventoryLogRepository>()
                .GetPagedByProductIdAsync(productId, new PaginationParams(1, 20), CancellationToken.None)
                .GetAwaiter().GetResult();

            logs.Items.Should().ContainSingle(log =>
                log.Reason == reason &&
                log.ChangedBy == changedBy &&
                log.PreviousCount == s.Initial &&
                log.NewCount == s.Initial + s.Delta);

            return true;
        });
    }

    private static UpdateOrderStatusCommandHandler CreateStatusHandler(IServiceProvider sp)
        => new(
            sp.GetRequiredService<IOrderRepository>(),
            sp.GetRequiredService<IProductRepository>(),
            sp.GetRequiredService<IInventoryLogRepository>(),
            sp.GetRequiredService<IUnitOfWork>());

    private static Order CreateOrderWithSingleItem(IServiceProvider sp, Guid productId, int quantity, string suffix)
    {
        var db = sp.GetRequiredService<ApplicationDbContext>();
        var product = db.Products.Single(p => p.Id == productId);

        var orderNumberRaw = $"ORD-{suffix}-{Guid.NewGuid():N}";
        var orderNumber = orderNumberRaw[..Math.Min(orderNumberRaw.Length, Order.OrderNumberMaxLength)];
        var idempotencyRaw = $"idem-{suffix}-{Guid.NewGuid():N}";
        var idempotency = idempotencyRaw[..Math.Min(idempotencyRaw.Length, Order.IdempotencyKeyMaxLength)];
        var paymentRefRaw = $"pay-{suffix}-{Guid.NewGuid():N}";
        var paymentRef = paymentRefRaw[..Math.Min(paymentRefRaw.Length, Order.PaymentReferenceMaxLength)];

        var order = new Order(
            orderNumber,
            idempotency,
            Guid.NewGuid(),
            "customer@example.com",
            "Customer",
            new ShippingAddress("Jane Doe", "123 Main St", null, "Harare", "Harare", "00000", "ZW", "263770000000"),
            Product.DefaultCurrency,
            1m,
            paymentRef,
            "paynow");

        order.AddItem(productId, product.Name, string.Empty, quantity, product.Price);
        order.SetTaxAndShipping(0m, 0m);
        order.RecalculateTotals();

        var orders = sp.GetRequiredService<IOrderRepository>();
        var uow = sp.GetRequiredService<IUnitOfWork>();
        orders.Add(order);
        uow.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
        return order;
    }

    private static Guid SeedProduct(ApplicationDbContext db, decimal price, int inventoryCount, int lowStockThreshold)
    {
        var category = new Category(
            "Inventory Category",
            $"inventory-category-{Guid.NewGuid():N}",
            null,
            displayOrder: 0);

        var product = new Product(
            name: "Inventory Product",
            slug: $"inventory-product-{Guid.NewGuid():N}",
            description: "Inventory test product",
            categoryId: category.Id,
            price: price,
            inventoryCount: inventoryCount,
            lowStockThreshold: lowStockThreshold,
            sku: null,
            currency: "USD",
            specifications: null);

        db.Categories.Add(category);
        db.Products.Add(product);
        db.SaveChanges();
        return product.Id;
    }
}
