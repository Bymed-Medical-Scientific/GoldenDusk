using Bymed.Domain.Events;

namespace Bymed.Domain.Primitives;

/// <summary>
/// Base class for all domain entities. Provides a unique identifier and domain event collection.
/// </summary>
public abstract class BaseEntity
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; protected set; }

    /// <summary>
    /// Returns the current domain events and clears the collection. Call after persisting so the dispatcher can publish them.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> GetAndClearDomainEvents()
    {
        var events = _domainEvents.ToList();
        _domainEvents.Clear();
        return events;
    }

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);
        _domainEvents.Add(domainEvent);
    }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }

    protected BaseEntity(Guid id)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Entity Id cannot be empty.", nameof(id));
        Id = id;
    }
}
