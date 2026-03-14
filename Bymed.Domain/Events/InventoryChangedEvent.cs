namespace Bymed.Domain.Events;

public sealed record InventoryChangedEvent(
    Guid ProductId,
    int PreviousCount,
    int NewCount,
    string Reason,
    string ChangedBy) : DomainEvent;
