namespace Bymed.Domain.Primitives;

/// <summary>
/// Interface for handling domain events
/// </summary>
/// <typeparam name="TDomainEvent">The type of domain event to handle</typeparam>
public interface IDomainEventHandler<in TDomainEvent> where TDomainEvent : IDomainEvent
{
    /// <summary>
    /// Handles the domain event
    /// </summary>
    /// <param name="domainEvent">The domain event to handle</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task Handle(TDomainEvent domainEvent, CancellationToken cancellationToken = default);
}
