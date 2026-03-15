namespace Bymed.Domain.Primitives;

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
