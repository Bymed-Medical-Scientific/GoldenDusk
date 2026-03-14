namespace Bymed.Domain.Events;

public sealed record ProductOutOfStockEvent(
    Guid ProductId,
    string ProductName,
    string? Sku) : DomainEvent;
