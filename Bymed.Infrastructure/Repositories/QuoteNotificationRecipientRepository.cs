using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class QuoteNotificationRecipientRepository : IQuoteNotificationRecipientRepository
{
    private readonly ApplicationDbContext _context;

    public QuoteNotificationRecipientRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<QuoteNotificationRecipient>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.QuoteNotificationRecipients
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.IsPrimaryRecipient)
            .ThenBy(x => x.Email)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
