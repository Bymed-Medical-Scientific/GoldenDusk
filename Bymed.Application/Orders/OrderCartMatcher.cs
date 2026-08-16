using Bymed.Domain.Entities;

namespace Bymed.Application.Orders;

internal static class OrderCartMatcher
{
    /// <summary>
    /// Returns true when the cart lines match the existing order lines (product id + quantity).
    /// </summary>
    public static bool Matches(Order order, Cart cart)
    {
        ArgumentNullException.ThrowIfNull(order);
        ArgumentNullException.ThrowIfNull(cart);

        var orderLines = order.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        var cartLines = cart.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        if (orderLines.Count != cartLines.Count)
            return false;

        foreach (var (productId, quantity) in orderLines)
        {
            if (!cartLines.TryGetValue(productId, out var cartQuantity) || cartQuantity != quantity)
                return false;
        }

        return true;
    }
}
