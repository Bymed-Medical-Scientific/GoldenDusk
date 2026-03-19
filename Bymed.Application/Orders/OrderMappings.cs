using Bymed.Domain.Entities;
using Bymed.Domain.ValueObjects;

namespace Bymed.Application.Orders;

internal static class OrderMappings
{
    public static OrderDto ToDto(Order order)
    {
        ArgumentNullException.ThrowIfNull(order);

        var shipping = order.ShippingAddress;
        var shippingDto = new ShippingAddressDto
        {
            Name = shipping.Name,
            AddressLine1 = shipping.AddressLine1,
            AddressLine2 = shipping.AddressLine2,
            City = shipping.City,
            State = shipping.State,
            PostalCode = shipping.PostalCode,
            Country = shipping.Country,
            Phone = shipping.Phone
        };

        var items = order.Items
            .Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                ProductImageUrl = i.ProductImageUrl,
                Quantity = i.Quantity,
                PricePerUnit = i.PricePerUnit,
                Subtotal = i.Subtotal
            })
            .ToList()
            .AsReadOnly();

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            IdempotencyKey = order.IdempotencyKey,
            UserId = order.UserId,
            Status = order.Status,
            CustomerEmail = order.CustomerEmail,
            CustomerName = order.CustomerName,
            ShippingAddress = shippingDto,
            Subtotal = order.Subtotal,
            Tax = order.Tax,
            ShippingCost = order.ShippingCost,
            Total = order.Total,
            Currency = order.Currency,
            ExchangeRate = order.ExchangeRate,
            PaymentStatus = order.PaymentStatus,
            PaymentReference = order.PaymentReference,
            PaymentMethod = order.PaymentMethod,
            TrackingNumber = order.TrackingNumber,
            Notes = order.Notes,
            Items = items,
            CreationTime = order.CreationTime,
            CreatorId = order.CreatorId,
            LastModificationTime = order.LastModificationTime,
            LastModifierUserId = order.LastModifierUserId
        };
    }

    public static ShippingAddress ToDomain(ShippingAddressDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return new ShippingAddress(
            dto.Name,
            dto.AddressLine1,
            dto.AddressLine2,
            dto.City,
            dto.State,
            dto.PostalCode,
            dto.Country,
            dto.Phone);
    }
}
