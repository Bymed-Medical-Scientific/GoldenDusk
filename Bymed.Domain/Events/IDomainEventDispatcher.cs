namespace Bymed.Domain.Events;

/// <summary>
/// Dispatches domain events to registered handlers. Implementation resides in Infrastructure.
/// Called when persisting entities (e.g. after SaveChanges) to publish raised events.
/// </summary>
public interface IDomainEventDispatcher
{
    /// <summary>
    /// Dispatches the given domain events to their handlers.
    /// </summary>
    /// <param name="domainEvents">Events to dispatch.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task DispatchAsync(IReadOnlyCollection<IDomainEvent> domainEvents, CancellationToken cancellationToken = default);
}
