namespace Bymed.Domain.Events;

/// <summary>
/// Marker interface for domain events. Domain events represent something that happened in the domain.
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAtUtc { get; }
}
