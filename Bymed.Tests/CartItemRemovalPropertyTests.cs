using Bymed.Application.Carts;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Property 6: Cart Item Removal.
/// For any existing cart item, removing it must delete it from the cart and update totals.
/// Validates: Requirements 2.5
/// </summary>
public class CartItemRemovalPropertyTests
{
    private sealed record Scenario(
        bool IsGuest,
        Guid UserId,
        string SessionId,
        int Quantity,
        decimal Price);

    // Feature: bymed-website, Property 6: Cart Item Removal
    [Property(MaxTest = 50)]
    public Property RemoveFromCart_RemovesItem_AndUpdatesTotals()
    {
        var nonEmptyGuidGen = ArbMap.Default.GeneratorFor<Guid>().Where(g => g != Guid.Empty);
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q > 0 && q <= 20);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 0m && p <= 500m);
        var isGuestGen = ArbMap.Default.GeneratorFor<bool>();
        var sessionIdGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Where(s => s.Length <= Bymed.Domain.Entities.Cart.SessionIdMaxLength);

        var scenarioArb = (from isGuest in isGuestGen
            from userId in nonEmptyGuidGen
            from sessionId in sessionIdGen
            from quantity in quantityGen
            from price in priceGen
            select new Scenario(isGuest, userId, sessionId, quantity, price)).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
            {
                var isGuest = scenario.IsGuest;
                var userId = scenario.UserId;
                var sessionId = scenario.SessionId;
                var quantity = scenario.Quantity;
                var price = scenario.Price;

                using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
                var sp = scope.ServiceProvider;
                var db = sp.GetRequiredService<ApplicationDbContext>();

                var cartRepo = sp.GetRequiredService<ICartRepository>();
                var productRepo = sp.GetRequiredService<IProductRepository>();
                var uow = sp.GetRequiredService<IUnitOfWork>();

                var addHandler = new AddToCartCommandHandler(cartRepo, productRepo, uow);
                var removeHandler = new RemoveCartItemCommandHandler(cartRepo, uow);
                var getHandler = new GetCartQueryHandler(cartRepo);

                var productId = CartTestHelpers.SeedProductAsync(db, price).GetAwaiter().GetResult();

                var addRes = addHandler.Handle(
                    new AddToCartCommand(
                        UserId: isGuest ? null : userId,
                        SessionId: isGuest ? sessionId : null,
                        Request: new AddToCartRequest { ProductId = productId, Quantity = quantity }),
                    CancellationToken.None).GetAwaiter().GetResult();

                addRes.IsSuccess.Should().BeTrue(addRes.Error ?? "expected success");
                addRes.Value.Should().NotBeNull();
                addRes.Value!.Items.Should().ContainSingle(i => i.ProductId == productId);

                var remRes = removeHandler.Handle(
                    new RemoveCartItemCommand(
                        UserId: isGuest ? null : userId,
                        SessionId: isGuest ? sessionId : null,
                        ProductId: productId),
                    CancellationToken.None).GetAwaiter().GetResult();

                remRes.IsSuccess.Should().BeTrue(remRes.Error ?? "expected success");
                remRes.Value.Should().NotBeNull();
                remRes.Value!.Items.Should().NotContain(i => i.ProductId == productId);
                remRes.Value.TotalItems.Should().Be(0);
                remRes.Value.Total.Should().Be(0m);

                var fetched = getHandler
                    .Handle(new GetCartQuery(isGuest ? null : userId, isGuest ? sessionId : null), CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                fetched.IsSuccess.Should().BeTrue();
                fetched.Value.Should().NotBeNull();
                fetched.Value!.Items.Should().NotContain(i => i.ProductId == productId);

                return true;
            });
    }
}

