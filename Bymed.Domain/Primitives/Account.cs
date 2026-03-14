namespace Bymed.Domain.Primitives;

/// <summary>
/// Represents the actor (user) performing an action in the domain.
/// Used for audit fields (creator, deleter, last modifier).
/// Infrastructure maps from Identity user to this domain type.
/// </summary>
public sealed class Account
{
    public Guid Id { get; }

    public Account(Guid id)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Account Id cannot be empty.", nameof(id));
        Id = id;
    }
}
