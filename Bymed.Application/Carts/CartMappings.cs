using Bymed.Domain.Entities;

namespace Bymed.Application.Carts;

internal static class CartMappings
{
    public static CartDto ToDto(Cart cart)
    {
        ArgumentNullException.ThrowIfNull(cart);

        var items = cart.Items
            .Select(i => new CartItemDto
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = i.PriceAtAdd,
                LineTotal = i.GetLineTotal()
            })
            .ToList()
            .AsReadOnly();

        return new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            SessionId = cart.SessionId,
            Items = items,
            TotalItems = cart.GetItemCount(),
            Total = cart.GetTotal()
        };
    }
}

