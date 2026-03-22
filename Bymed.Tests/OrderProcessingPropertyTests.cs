using System.Security.Cryptography;
using System.Text;
using Bymed.Application.Carts;
using Bymed.Application.Common;
using Bymed.Application.Orders;
using Bymed.Application.Payments;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Application.Notifications;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure.Payments;
using FluentAssertions;
using FluentValidation;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

public class OrderProcessingPropertyTests
{
    [Property(MaxTest = 40)]
    public Property CheckoutValidation_RejectsMissingRequiredFields()
    {
        var boolGen = ArbMap.Default.GeneratorFor<bool>();
        var scenarioArb = (from missingIdempotency in boolGen
            from missingEmail in boolGen
            from missingName in boolGen
            from missingShipping in boolGen
            from missingPaymentMethod in boolGen
            where missingIdempotency || missingEmail || missingName || missingShipping || missingPaymentMethod
            select new
            {
                MissingIdempotency = missingIdempotency,
                MissingEmail = missingEmail,
                MissingName = missingName,
                MissingShipping = missingShipping,
                MissingPaymentMethod = missingPaymentMethod
            }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            var req = new CreateOrderRequest
            {
                IdempotencyKey = s.MissingIdempotency ? "" : Guid.NewGuid().ToString("N"),
                UserId = Guid.NewGuid(),
                SessionId = null,
                CustomerEmail = s.MissingEmail ? "" : "customer@example.com",
                CustomerName = s.MissingName ? "" : "Customer",
                ShippingAddress = s.MissingShipping ? null! : CreateShippingAddress(),
                PaymentMethod = s.MissingPaymentMethod ? "" : "paynow",
                Tax = 0m,
                ShippingCost = 0m
            };

            var validator = new CreateOrderRequestValidator();
            var validation = validator.Validate(req);
            validation.IsValid.Should().BeFalse();
            return true;
        });
    }

    [Property(MaxTest = 25)]
    public Property OrderCreationOnPaymentSuccess_PersistsOrderWithItems()
    {
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q >= 1 && q <= 3);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 1m && p <= 200m);
        var scenarioArb = (from quantity in quantityGen
            from price in priceGen
            select new { Quantity = quantity, Price = decimal.Round(price, 2) }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();
            var key = Guid.NewGuid().ToString("N");

            AddItemToUserCart(sp, userId, s.Price, s.Quantity);

            var process = CreateProcessOrderHandler(sp);
            var created = process.Handle(
                new ProcessOrderCommand(CreateOrderRequestForUser(userId, key)),
                CancellationToken.None).GetAwaiter().GetResult();
            created.IsSuccess.Should().BeTrue(created.Error);
            created.Value.Should().NotBeNull();
            created.Value!.Items.Should().HaveCount(1);

            var paymentService = CreatePaymentService(sp, "test-integration-key");
            var webhookRaw = BuildWebhookRawBody("Paid", key, "PN-SUCCESS-001", "10.00", "test-integration-key");
            var fields = ParseFields(webhookRaw);
            var webhookResult = paymentService.HandleWebhookAsync(new PayNowWebhookEvent
            {
                RawBody = webhookRaw,
                Fields = fields
            }).GetAwaiter().GetResult();

            webhookResult.Success.Should().BeTrue(webhookResult.ErrorMessage);
            var orderRepo = sp.GetRequiredService<IOrderRepository>();
            var order = orderRepo.GetByIdempotencyKeyAsync(key, CancellationToken.None).GetAwaiter().GetResult();
            order.Should().NotBeNull();
            order!.Items.Should().HaveCount(1);
            order.PaymentStatus.Should().Be(PaymentStatus.Completed);

            return true;
        });
    }

    [Property(MaxTest = 25)]
    public Property CartPreservationOnPaymentFailure_LeavesCartUnchanged()
    {
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q >= 1 && q <= 4);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 1m && p <= 300m);
        var scenarioArb = (from quantity in quantityGen
            from price in priceGen
            select new { Quantity = quantity, Price = decimal.Round(price, 2) }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();
            var key = Guid.NewGuid().ToString("N");

            AddItemToUserCart(sp, userId, s.Price, s.Quantity);
            var cartRepo = sp.GetRequiredService<ICartRepository>();
            var before = cartRepo.GetByUserIdAsync(userId, CancellationToken.None).GetAwaiter().GetResult();
            before.Should().NotBeNull();
            var beforeCount = before!.GetItemCount();
            var beforeTotal = before.GetTotal();

            var process = CreateProcessOrderHandler(sp);
            var created = process.Handle(
                new ProcessOrderCommand(CreateOrderRequestForUser(userId, key)),
                CancellationToken.None).GetAwaiter().GetResult();
            created.IsSuccess.Should().BeTrue(created.Error);

            var paymentService = CreatePaymentService(sp, "test-integration-key");
            var webhookRaw = BuildWebhookRawBody("Failed", key, "PN-FAIL-001", "10.00", "test-integration-key");
            var webhookResult = paymentService.HandleWebhookAsync(new PayNowWebhookEvent
            {
                RawBody = webhookRaw,
                Fields = ParseFields(webhookRaw)
            }).GetAwaiter().GetResult();
            webhookResult.Success.Should().BeTrue(webhookResult.ErrorMessage);

            var after = cartRepo.GetByUserIdAsync(userId, CancellationToken.None).GetAwaiter().GetResult();
            after.Should().NotBeNull();
            after!.GetItemCount().Should().Be(beforeCount);
            after.GetTotal().Should().Be(beforeTotal);
            return true;
        });
    }

    [Property(MaxTest = 30)]
    public Property OrderHistoryRetrieval_ReturnsOnlyCurrentUserOrders()
    {
        var ordersGen = ArbMap.Default.GeneratorFor<int>().Where(n => n >= 1 && n <= 3);
        var scenarioArb = (from myCount in ordersGen
            from otherCount in ordersGen
            select new { MyCount = myCount, OtherCount = otherCount }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var mine = Guid.NewGuid();
            var other = Guid.NewGuid();

            for (var i = 0; i < s.MyCount; i++)
                CreateDirectOrder(sp, mine, $"mine-{i}", OrderStatus.Pending);
            for (var i = 0; i < s.OtherCount; i++)
                CreateDirectOrder(sp, other, $"other-{i}", OrderStatus.Pending);

            var handler = new GetUserOrdersQueryHandler(sp.GetRequiredService<IOrderRepository>());
            var result = handler.Handle(new GetUserOrdersQuery(mine, 1, 50), CancellationToken.None).GetAwaiter().GetResult();

            result.Items.Should().HaveCount(s.MyCount);
            result.Items.Should().OnlyContain(o => o.UserId == mine);
            return true;
        });
    }

    [Property(MaxTest = 25)]
    public Property OrderFilteringAccuracy_ByStatusAndDateRange()
    {
        var scenarioArb = ArbMap.Default.GeneratorFor<bool>().ToArbitrary();
        return Prop.ForAll(scenarioArb, _ =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();

            var orderA = CreateDirectOrder(sp, userId, "flt-a", OrderStatus.Processing);
            var orderB = CreateDirectOrder(sp, userId, "flt-b", OrderStatus.Cancelled);

            var handler = new GetAllOrdersQueryHandler(sp.GetRequiredService<IOrderRepository>());
            var now = DateTime.UtcNow;
            var filtered = handler.Handle(
                new GetAllOrdersQuery(1, 100, OrderStatus.Processing, now.AddDays(-1), now.AddDays(1)),
                CancellationToken.None).GetAwaiter().GetResult();
            filtered.Items.Should().OnlyContain(o => o.Status == OrderStatus.Processing);
            filtered.Items.Should().ContainSingle(o => o.Id == orderA.Id);

            var future = handler.Handle(
                new GetAllOrdersQuery(1, 100, null, now.AddDays(10), now.AddDays(11)),
                CancellationToken.None).GetAwaiter().GetResult();
            future.Items.Should().BeEmpty();
            return true;
        });
    }

    [Property(MaxTest = 20)]
    public Property OrderStatusUpdates_PersistsValidTransitions()
    {
        var pathGen = ArbMap.Default.GeneratorFor<bool>().ToArbitrary();
        return Prop.ForAll(pathGen, deliveredPath =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();
            var order = CreateSingleItemOrder(sp, userId, "sts");

            var handler = new UpdateOrderStatusCommandHandler(
                sp.GetRequiredService<IOrderRepository>(),
                sp.GetRequiredService<IProductRepository>(),
                sp.GetRequiredService<IInventoryLogRepository>(),
                sp.GetRequiredService<IUnitOfWork>(),
                Substitute.For<IEmailService>());

            var first = handler.Handle(
                new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Processing }),
                CancellationToken.None).GetAwaiter().GetResult();
            first.IsSuccess.Should().BeTrue(first.Error);

            if (deliveredPath)
            {
                handler.Handle(
                    new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Shipped }),
                    CancellationToken.None).GetAwaiter().GetResult().IsSuccess.Should().BeTrue();
                var delivered = handler.Handle(
                    new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Delivered }),
                    CancellationToken.None).GetAwaiter().GetResult();
                delivered.IsSuccess.Should().BeTrue(delivered.Error);
                delivered.Value!.Status.Should().Be(OrderStatus.Delivered);
            }
            else
            {
                var cancelled = handler.Handle(
                    new UpdateOrderStatusCommand(order.Id, new UpdateOrderStatusRequest { Status = OrderStatus.Cancelled }),
                    CancellationToken.None).GetAwaiter().GetResult();
                cancelled.IsSuccess.Should().BeTrue(cancelled.Error);
                cancelled.Value!.Status.Should().Be(OrderStatus.Cancelled);
            }

            return true;
        });
    }

    [Property(MaxTest = 25)]
    public Property OrderAnalyticsCalculation_MatchesOrderTotalsInRange()
    {
        var countGen = ArbMap.Default.GeneratorFor<int>().Where(n => n >= 1 && n <= 4);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 1m && p <= 50m);
        var qtyGen = ArbMap.Default.GeneratorFor<int>().Where(q => q >= 1 && q <= 3);
        var scenarioArb = (from count in countGen
            from price in priceGen
            from qty in qtyGen
            select new { Count = count, Price = decimal.Round(price, 2), Qty = qty }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();

            decimal expectedTotal = 0m;
            for (var i = 0; i < s.Count; i++)
            {
                var order = CreateDirectOrder(sp, userId, $"an-{i}", OrderStatus.Pending, s.Price, s.Qty);
                expectedTotal += order.Total;
            }

            var handler = new GetOrderAnalyticsQueryHandler(sp.GetRequiredService<IOrderRepository>());
            var now = DateTime.UtcNow;
            var result = handler.Handle(new GetOrderAnalyticsQuery(now.AddDays(-1), now.AddDays(1)), CancellationToken.None)
                .GetAwaiter().GetResult();

            result.TotalOrderCount.Should().Be(s.Count);
            result.TotalRevenue.Should().Be(expectedTotal);
            return true;
        });
    }

    [Property(MaxTest = 20)]
    public Property OrderExportCompleteness_IncludesAllColumnsAndRows()
    {
        var countGen = ArbMap.Default.GeneratorFor<int>().Where(n => n >= 1 && n <= 3);
        var scenarioArb = countGen.ToArbitrary();
        return Prop.ForAll(scenarioArb, count =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;
            var userId = Guid.NewGuid();

            var itemRows = 0;
            for (var i = 0; i < count; i++)
            {
                CreateDirectOrder(sp, userId, $"exp-{i}", OrderStatus.Pending, 10m + i, 1);
                itemRows++;
            }

            var handler = new ExportOrdersQueryHandler(sp.GetRequiredService<IOrderRepository>());
            var lines = handler.Handle(new ExportOrdersQuery(null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1)), CancellationToken.None)
                .GetAwaiter().GetResult()
                .ToBlockingList();

            lines.Should().NotBeEmpty();
            var header = lines[0];
            header.Should().Contain("IdempotencyKey");
            header.Should().Contain("PaymentReference");
            header.Should().Contain("ShippingAddressLine1");
            header.Should().Contain("OrderItemId");
            var expectedColumns = header.Split(',').Length;

            lines.Count.Should().Be(1 + itemRows);
            foreach (var line in lines.Skip(1))
                line.Split(',').Length.Should().Be(expectedColumns);

            return true;
        });
    }

    private static ProcessOrderCommandHandler CreateProcessOrderHandler(IServiceProvider sp)
        => new(
            sp.GetRequiredService<IOrderRepository>(),
            sp.GetRequiredService<ICartRepository>(),
            sp.GetRequiredService<IProductRepository>(),
            sp.GetRequiredService<IProductImageRepository>(),
            sp.GetRequiredService<IUnitOfWork>(),
            Substitute.For<IEmailService>());

    private static void AddItemToUserCart(IServiceProvider sp, Guid userId, decimal price, int quantity)
    {
        var db = sp.GetRequiredService<ApplicationDbContext>();
        var productId = CartTestHelpers.SeedProductAsync(db, price).GetAwaiter().GetResult();

        var add = new AddToCartCommandHandler(
            sp.GetRequiredService<ICartRepository>(),
            sp.GetRequiredService<IProductRepository>(),
            sp.GetRequiredService<IUnitOfWork>());

        var res = add.Handle(
            new AddToCartCommand(userId, null, new AddToCartRequest { ProductId = productId, Quantity = quantity }),
            CancellationToken.None).GetAwaiter().GetResult();
        res.IsSuccess.Should().BeTrue(res.Error);
    }

    private static Order CreateSingleItemOrder(IServiceProvider sp, Guid userId, string suffix, decimal price = 10m, int quantity = 1)
    {
        AddItemToUserCart(sp, userId, price, quantity);
        var handler = CreateProcessOrderHandler(sp);
        var req = CreateOrderRequestForUser(userId, $"key-{suffix}-{Guid.NewGuid():N}");
        var res = handler.Handle(new ProcessOrderCommand(req), CancellationToken.None).GetAwaiter().GetResult();
        res.IsSuccess.Should().BeTrue(res.Error);
        var order = sp.GetRequiredService<IOrderRepository>()
            .GetByIdAsync(res.Value!.Id, CancellationToken.None).GetAwaiter().GetResult();
        order.Should().NotBeNull();
        return order!;
    }

    private static Order CreateDirectOrder(
        IServiceProvider sp,
        Guid userId,
        string suffix,
        OrderStatus status,
        decimal price = 10m,
        int quantity = 1)
    {
        var db = sp.GetRequiredService<ApplicationDbContext>();
        var productId = CartTestHelpers.SeedProductAsync(db, price).GetAwaiter().GetResult();
        var product = db.Products.Single(p => p.Id == productId);

        var orderNumber = $"ORD-{suffix}-{Guid.NewGuid():N}";
        if (orderNumber.Length > Order.OrderNumberMaxLength)
            orderNumber = orderNumber[..Order.OrderNumberMaxLength];

        var idempotency = $"idem-{suffix}-{Guid.NewGuid():N}";
        if (idempotency.Length > Order.IdempotencyKeyMaxLength)
            idempotency = idempotency[..Order.IdempotencyKeyMaxLength];

        var paymentRef = $"pay-{suffix}-{Guid.NewGuid():N}";
        if (paymentRef.Length > Order.PaymentReferenceMaxLength)
            paymentRef = paymentRef[..Order.PaymentReferenceMaxLength];

        var order = new Order(
            orderNumber,
            idempotency,
            userId,
            sessionId: null,
            "customer@example.com",
            "Customer",
            new Bymed.Domain.ValueObjects.ShippingAddress("Jane Doe", "123 Main St", null, "Harare", "Harare", "00000", "ZW", "263770000000"),
            Product.DefaultCurrency,
            1m,
            paymentRef,
            "paynow");

        order.AddItem(productId, product.Name, string.Empty, quantity, price);
        order.SetTaxAndShipping(1m, 2m);
        order.RecalculateTotals();
        order.SetStatus(status);

        var orderRepo = sp.GetRequiredService<IOrderRepository>();
        var uow = sp.GetRequiredService<IUnitOfWork>();
        orderRepo.Add(order);
        uow.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
        return order;
    }

    private static CreateOrderRequest CreateOrderRequestForUser(Guid userId, string idempotencyKey)
        => new()
        {
            IdempotencyKey = idempotencyKey,
            UserId = userId,
            SessionId = null,
            CustomerEmail = "customer@example.com",
            CustomerName = "Customer",
            ShippingAddress = CreateShippingAddress(),
            PaymentMethod = "paynow",
            Tax = 1m,
            ShippingCost = 2m
        };

    private static ShippingAddressDto CreateShippingAddress()
        => new()
        {
            Name = "Jane Doe",
            AddressLine1 = "123 Main St",
            AddressLine2 = null,
            City = "Harare",
            State = "Harare",
            PostalCode = "00000",
            Country = "ZW",
            Phone = "263770000000"
        };

    private static PayNowPaymentService CreatePaymentService(IServiceProvider sp, string integrationKey)
        => new(
            httpClient: new HttpClient(),
            logger: NullLogger<PayNowPaymentService>.Instance,
            options: new OptionsWrapper<PayNowOptions>(new PayNowOptions
            {
                IntegrationId = "123",
                IntegrationKey = integrationKey,
                InitiateTransactionUrl = "https://example.com",
                TraceUrl = "https://example.com",
                ReturnUrl = "https://example.com",
                ResultUrl = "https://example.com"
            }),
            transactions: sp.GetRequiredService<IPaymentTransactionRepository>(),
            orders: sp.GetRequiredService<IOrderRepository>(),
            uow: sp.GetRequiredService<IUnitOfWork>());

    private static string BuildWebhookRawBody(string status, string reference, string payNowRef, string amount, string integrationKey)
    {
        var rawWithoutHash = $"status={status}&reference={reference}&paynowreference={payNowRef}&amount={amount}&pollurl=https://example.com/poll";
        var hash = ComputeInboundHash(rawWithoutHash, integrationKey);
        return $"{rawWithoutHash}&hash={hash}";
    }

    private static IReadOnlyDictionary<string, string> ParseFields(string rawBody)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var pair in rawBody.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = pair.IndexOf('=');
            if (idx <= 0) continue;
            dict[pair[..idx]] = pair[(idx + 1)..];
        }

        return dict;
    }

    private static string ComputeInboundHash(string rawWithoutHash, string integrationKey)
    {
        var values = rawWithoutHash.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(pair =>
            {
                var idx = pair.IndexOf('=');
                return idx >= 0 ? pair[(idx + 1)..] : string.Empty;
            });

        var concat = new StringBuilder();
        foreach (var v in values)
            concat.Append(v.Trim());
        concat.Append(integrationKey);

        using var sha = SHA512.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(concat.ToString()));
        var hex = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
            hex.AppendFormat("{0:X2}", b);
        return hex.ToString();
    }

}

internal static class AsyncEnumerableExtensions
{
    public static List<T> ToBlockingList<T>(this IAsyncEnumerable<T> source)
    {
        return ToListAsync(source).GetAwaiter().GetResult();
    }

    private static async Task<List<T>> ToListAsync<T>(IAsyncEnumerable<T> source)
    {
        var list = new List<T>();
        await foreach (var item in source)
            list.Add(item);
        return list;
    }
}
