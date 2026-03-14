namespace Bymed.Domain.Events;

/// <summary>
/// Handles a specific type of domain event. Implement in Application layer and register with the dispatcher.
/// </summary>
/// <typeparam name="TDomainEvent">The domain event type to handle.</typeparam>
public interface IDomainEventHandler<in TDomainEvent> where TDomainEvent : IDomainEvent
{
    Task HandleAsync(TDomainEvent domainEvent, CancellationToken cancellationToken = default);
}
