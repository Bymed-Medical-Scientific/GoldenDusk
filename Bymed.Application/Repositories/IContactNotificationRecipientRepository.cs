using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IContactNotificationRecipientRepository
{
    Task<IReadOnlyList<ContactNotificationRecipient>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ContactNotificationRecipient>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ContactNotificationRecipient?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    void Add(ContactNotificationRecipient recipient);
    void Update(ContactNotificationRecipient recipient);
}
