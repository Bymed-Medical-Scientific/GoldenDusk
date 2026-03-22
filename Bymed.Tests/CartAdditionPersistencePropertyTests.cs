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
/// Property 3: Cart Addition Persistence.
/// For any valid add-to-cart request, the cart must be persisted and retrievable with the same item + quantity.
/// Validates: Requirements 2.1
/// </summary>
public class CartAdditionPersistencePropertyTests
{
    private sealed record Scenario(
        bool IsGuest,
        Guid UserId,
        string SessionId,
        int Quantity,
        decimal Price);

    // Feature: bymed-website, Property 3: Cart Addition Persistence
    [Property(MaxTest = 50)]
    public Property AddToCart_PersistsCart_ForUserOrGuest()
    {
        var nonEmptyGuidGen = ArbMap.Default.GeneratorFor<Guid>().Where(g => g != Guid.Empty);
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q > 0 && q <= 20);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 0m && p <= 1000m);
        var sessionIdGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => string.Concat(s.Trim().Where(c => !char.IsControl(c))))
            .Where(s => s.Length > 0 && s.Length <= Bymed.Domain.Entities.Cart.SessionIdMaxLength);
        var isGuestGen = ArbMap.Default.GeneratorFor<bool>();

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
                if (!isGuest)
                    CartTestHelpers.SeedUserAsync(db, userId).GetAwaiter().GetResult();
                var productId = CartTestHelpers.SeedProductAsync(db, price, isAvailable: true).GetAwaiter().GetResult();

                var cartRepo = sp.GetRequiredService<ICartRepository>();
                var productRepo = sp.GetRequiredService<IProductRepository>();
                var uow = sp.GetRequiredService<IUnitOfWork>();

                var handler = new AddToCartCommandHandler(cartRepo, productRepo, uow);

                var cmd = new AddToCartCommand(
                    UserId: isGuest ? null : userId,
                    SessionId: isGuest ? sessionId : null,
                    Request: new AddToCartRequest { ProductId = productId, Quantity = quantity });

                var result = handler.Handle(cmd, CancellationToken.None).GetAwaiter().GetResult();
                result.IsSuccess.Should().BeTrue(result.Error ?? "expected success");
                result.Value.Should().NotBeNull();
                CartTestHelpers.AssertCartHasSingleItem(result.Value!, productId, quantity, price);

                var getHandler = new GetCartQueryHandler(cartRepo);
                var fetched = getHandler
                    .Handle(new GetCartQuery(isGuest ? null : userId, isGuest ? sessionId : null), CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                fetched.IsSuccess.Should().BeTrue();
                fetched.Value.Should().NotBeNull("cart should be persisted and retrievable");
                CartTestHelpers.AssertCartHasSingleItem(fetched.Value!, productId, quantity, price);

                return true;
            });
    }
}

