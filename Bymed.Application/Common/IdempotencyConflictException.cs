namespace Bymed.Application.Common;

/// <summary>
/// Thrown when a concurrent insert violates a unique idempotency constraint.
/// Callers should reload the existing resource and return it to the client.
/// </summary>
public sealed class IdempotencyConflictException : Exception
{
    public IdempotencyConflictException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
