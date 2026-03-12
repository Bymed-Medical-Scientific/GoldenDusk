namespace Bymed.Domain.Primitives;

/// <summary>
/// Base class for domain events providing common properties
/// </summary>
public abstract class DomainEvent : IDomainEvent
{
    /// <summary>
    /// Unique identifier for the event
    /// </summary>
    public Guid EventId { get; } = Guid.NewGuid();

    /// <summary>
    /// Timestamp when the event occurred
    /// </summary>
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
