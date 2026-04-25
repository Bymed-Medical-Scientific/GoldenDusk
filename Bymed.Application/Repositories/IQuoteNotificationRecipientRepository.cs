using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IQuoteNotificationRecipientRepository
{
    Task<IReadOnlyList<QuoteNotificationRecipient>> GetActiveAsync(CancellationToken cancellationToken = default);
}
