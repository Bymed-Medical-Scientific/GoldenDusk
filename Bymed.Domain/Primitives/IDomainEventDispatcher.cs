namespace Bymed.Domain.Primitives;

/// <summary>
/// Interface for dispatching domain events to their handlers
/// </summary>
public interface IDomainEventDispatcher
{
    /// <summary>
    /// Dispatches a single domain event to all registered handlers
    /// </summary>
    /// <param name="domainEvent">The domain event to dispatch</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Dispatches multiple domain events to their registered handlers
    /// </summary>
    /// <param name="domainEvents">The collection of domain events to dispatch</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DispatchAsync(IEnumerable<IDomainEvent> domainEvents, CancellationToken cancellationToken = default);
}
