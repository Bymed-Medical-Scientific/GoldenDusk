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
/// Property 4: Cart Item Count Accuracy.
/// For any set of add-to-cart operations, TotalItems must equal the sum of item quantities.
/// Validates: Requirements 2.2
/// </summary>
public class CartItemCountAccuracyPropertyTests
{
    private sealed record Scenario(
        bool IsGuest,
        Guid UserId,
        string SessionId,
        int ItemCount,
        int[] Quantities);

    // Feature: bymed-website, Property 4: Cart Item Count Accuracy
    [Property(MaxTest = 50)]
    public Property Cart_TotalItems_EqualsSumOfQuantities()
    {
        var nonEmptyGuidGen = ArbMap.Default.GeneratorFor<Guid>().Where(g => g != Guid.Empty);
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q > 0 && q <= 10);
        var itemCountGen = ArbMap.Default.GeneratorFor<int>().Where(n => n >= 1 && n <= 5);
        var isGuestGen = ArbMap.Default.GeneratorFor<bool>();
        var sessionIdGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Where(s => s.Length <= Bymed.Domain.Entities.Cart.SessionIdMaxLength);

        var scenarioArb = (from isGuest in isGuestGen
            from userId in nonEmptyGuidGen
            from sessionId in sessionIdGen
            from itemCount in itemCountGen
            from quantities in Gen.ArrayOf(quantityGen, itemCount)
            select new Scenario(isGuest, userId, sessionId, itemCount, quantities)).ToArbitrary();

        return Prop.ForAll(scenarioArb, scenario =>
            {
                var isGuest = scenario.IsGuest;
                var userId = scenario.UserId;
                var sessionId = scenario.SessionId;
                var itemCount = scenario.ItemCount;

                using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
                var sp = scope.ServiceProvider;
                var db = sp.GetRequiredService<ApplicationDbContext>();

                var cartRepo = sp.GetRequiredService<ICartRepository>();
                var productRepo = sp.GetRequiredService<IProductRepository>();
                var uow = sp.GetRequiredService<IUnitOfWork>();
                var addHandler = new AddToCartCommandHandler(cartRepo, productRepo, uow);
                var getHandler = new GetCartQueryHandler(cartRepo);

                var expectedTotalItems = 0;

                for (var i = 0; i < itemCount; i++)
                {
                    var qty = scenario.Quantities[i];
                    var price = 10m + i;
                    var productId = CartTestHelpers.SeedProductAsync(db, price).GetAwaiter().GetResult();

                    expectedTotalItems += qty;

                    var res = addHandler.Handle(
                        new AddToCartCommand(
                            UserId: isGuest ? null : userId,
                            SessionId: isGuest ? sessionId : null,
                            Request: new AddToCartRequest { ProductId = productId, Quantity = qty }),
                        CancellationToken.None).GetAwaiter().GetResult();

                    res.IsSuccess.Should().BeTrue(res.Error ?? "expected success");
                }

                var fetched = getHandler
                    .Handle(new GetCartQuery(isGuest ? null : userId, isGuest ? sessionId : null), CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                fetched.IsSuccess.Should().BeTrue();
                fetched.Value.Should().NotBeNull();
                fetched.Value!.TotalItems.Should().Be(expectedTotalItems);

                return true;
            });
    }
}

