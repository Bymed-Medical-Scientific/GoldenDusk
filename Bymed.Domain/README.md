# Bymed.Domain

This is the Domain Layer of the Bymed Medical & Scientific website, following Clean Architecture principles. The Domain Layer contains the core business logic and is independent of external concerns.

## Structure

### Primitives
Core building blocks for the domain model:

- **Account**: Represents the actor (user) performing an action. Used for audit fields. Infrastructure maps from Identity user to this type.

- **BaseEntity**: Abstract base class for all domain entities
  - Provides `Id` (Guid)
  - Supports domain events with `AddDomainEvent()` and `GetAndClearDomainEvents()`
  - All entities should inherit from this class

- **AuditedEntity**: Extends BaseEntity with creation and soft-delete audit
  - `CreationTime`, `CreatorId`, `Creator`
  - `IsDeleted`, `DeletionTime`, `DeleterId`, `Deleter`
  - `PrepareEntityForCreate(Account)`, `PrepareEntityForDelete(Account)`

- **FullAuditedEntity**: Extends AuditedEntity with last-modification audit
  - `LastModificationTime`, `LastModifierUserId`, `LastModifier`
  - `PrepareEntityForUpdate(Account)`, `PrepareForCreateAndUpdate(Account)`

- **IDomainEvent**: Marker interface for domain events
  - Defines `EventId` and `OccurredAtUtc`

- **DomainEvent**: Abstract base record for domain events
  - Implements `IDomainEvent` with automatic ID and timestamp

- **IDomainEventHandler<TDomainEvent>**: Interface for event handlers
  - Implement in Application layer to handle specific domain events

- **IDomainEventDispatcher**: Interface for dispatching domain events
  - Used to publish events to registered handlers after persistence
  - Implementation resides in the Infrastructure layer

### Events
Domain events that represent significant business occurrences:

- **OrderCreatedEvent**: Raised when a new order is created
- **ProductOutOfStockEvent**: Raised when a product inventory reaches zero
- **InventoryChangedEvent**: Raised when product inventory is modified

## Usage

### Creating a Domain Entity

```csharp
public class Product : BaseEntity
{
    public string Name { get; private set; }
    public int InventoryCount { get; private set; }
    
    public void UpdateInventory(int newCount, string reason, string changedBy)
    {
        var previousCount = InventoryCount;
        InventoryCount = newCount;
        
        // Raise domain event
        AddDomainEvent(new InventoryChangedEvent(
            Id, 
            previousCount, 
            newCount, 
            reason, 
            changedBy
        ));
        
        if (InventoryCount == 0)
        {
            AddDomainEvent(new ProductOutOfStockEvent(Id, Name, Sku));
        }
    }
}
```

### Creating a Domain Event

```csharp
public sealed record MyCustomEvent(Guid EntityId, string Data) : DomainEvent;
```

### Handling Domain Events

Event handlers are implemented in the Application layer and registered with the dispatcher (Infrastructure):

```csharp
public class OrderCreatedEventHandler : IDomainEventHandler<OrderCreatedEvent>
{
    private readonly IEmailService _emailService;

    public async Task HandleAsync(OrderCreatedEvent domainEvent, CancellationToken cancellationToken)
    {
        await _emailService.SendOrderConfirmationAsync(domainEvent.OrderId);
    }
}
```

## Design Principles

1. **Encapsulation**: Entity state is modified through methods, not direct property setters
2. **Domain Events**: Significant business events are captured as domain events
3. **Persistence Ignorance**: No dependencies on databases or ORMs
4. **Rich Domain Model**: Business logic lives in the domain entities
5. **Immutability**: Domain events are immutable (init-only or readonly properties)

## Dependencies

This layer has NO external dependencies - it's pure C# business logic. This ensures the domain model remains stable and testable.
