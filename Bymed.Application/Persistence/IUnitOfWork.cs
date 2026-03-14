namespace Bymed.Application.Persistence;

/// <summary>
/// Unit of work for persisting all changes made via repositories in a single transaction.
/// Implemented in Infrastructure with the same DbContext used by repositories.
/// </summary>
public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
