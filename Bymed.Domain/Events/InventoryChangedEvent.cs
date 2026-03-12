using Bymed.Domain.Primitives;

namespace Bymed.Domain.Events;

/// <summary>
/// Domain event raised when product inventory changes
/// </summary>
public sealed class InventoryChangedEvent : DomainEvent
{
    public InventoryChangedEvent(
        Guid productId, 
        int previousCount, 
        int newCount, 
        string reason, 
        string changedBy)
    {
        ProductId = productId;
        PreviousCount = previousCount;
        NewCount = newCount;
        Reason = reason;
        ChangedBy = changedBy;
    }

    /// <summary>
    /// The ID of the product whose inventory changed
    /// </summary>
    public Guid ProductId { get; }

    /// <summary>
    /// The previous inventory count
    /// </summary>
    public int PreviousCount { get; }

    /// <summary>
    /// The new inventory count
    /// </summary>
    public int NewCount { get; }

    /// <summary>
    /// The reason for the inventory change
    /// </summary>
    public string Reason { get; }

    /// <summary>
    /// The user or system that changed the inventory
    /// </summary>
    public string ChangedBy { get; }
}
