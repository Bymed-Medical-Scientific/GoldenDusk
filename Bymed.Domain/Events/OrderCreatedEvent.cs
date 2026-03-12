using Bymed.Domain.Primitives;

namespace Bymed.Domain.Events;

/// <summary>
/// Domain event raised when an order is created
/// </summary>
public sealed class OrderCreatedEvent : DomainEvent
{
    public OrderCreatedEvent(Guid orderId, string orderNumber, Guid? userId, decimal total, string currency)
    {
        OrderId = orderId;
        OrderNumber = orderNumber;
        UserId = userId;
        Total = total;
        Currency = currency;
    }

    /// <summary>
    /// The ID of the created order
    /// </summary>
    public Guid OrderId { get; }

    /// <summary>
    /// The order number
    /// </summary>
    public string OrderNumber { get; }

    /// <summary>
    /// The ID of the user who created the order (null for guest orders)
    /// </summary>
    public Guid? UserId { get; }

    /// <summary>
    /// The total amount of the order
    /// </summary>
    public decimal Total { get; }

    /// <summary>
    /// The currency of the order
    /// </summary>
    public string Currency { get; }
}
