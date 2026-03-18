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
/// Property 5: Cart Total Calculation.
/// For any set of cart items, Total must equal sum(quantity * unitPrice) and each LineTotal must match.
/// Validates: Requirements 2.3, 2.4
/// </summary>
public class CartTotalCalculationPropertyTests
{
    private sealed record Scenario(
        bool IsGuest,
        Guid UserId,
        string SessionId,
        int ItemCount,
        int[] Quantities,
        decimal[] Prices);

    // Feature: bymed-website, Property 5: Cart Total Calculation
    [Property(MaxTest = 50)]
    public Property Cart_Total_EqualsSumOfLineTotals()
    {
        var nonEmptyGuidGen = ArbMap.Default.GeneratorFor<Guid>().Where(g => g != Guid.Empty);
        var quantityGen = ArbMap.Default.GeneratorFor<int>().Where(q => q > 0 && q <= 10);
        var priceGen = ArbMap.Default.GeneratorFor<decimal>().Where(p => p >= 0m && p <= 250m);
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
            from prices in Gen.ArrayOf(priceGen, itemCount)
            select new Scenario(isGuest, userId, sessionId, itemCount, quantities, prices)).ToArbitrary();

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

                decimal expectedTotal = 0m;

                for (var i = 0; i < itemCount; i++)
                {
                    var qty = scenario.Quantities[i];
                    var price = scenario.Prices[i];
                    var productId = CartTestHelpers.SeedProductAsync(db, price).GetAwaiter().GetResult();

                    expectedTotal += qty * price;

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

                var dto = fetched.Value!;
                dto.Items.Should().NotBeEmpty();
                dto.Items.Sum(i => i.LineTotal).Should().Be(expectedTotal);
                dto.Total.Should().Be(expectedTotal);

                return true;
            });
    }
}

