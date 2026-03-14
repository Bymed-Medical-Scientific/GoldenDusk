namespace Bymed.Domain.Events;

/// <summary>
/// Base class for domain events. Provides a unique event id and timestamp.
/// </summary>
public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; } = DateTime.UtcNow;
}
