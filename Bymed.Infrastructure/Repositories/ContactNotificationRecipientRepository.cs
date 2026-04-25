using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class ContactNotificationRecipientRepository : IContactNotificationRecipientRepository
{
    private readonly ApplicationDbContext _context;

    public ContactNotificationRecipientRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IReadOnlyList<ContactNotificationRecipient>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ContactNotificationRecipients
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.IsPrimaryRecipient)
            .ThenBy(x => x.Email)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ContactNotificationRecipient>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ContactNotificationRecipients
            .AsNoTracking()
            .OrderByDescending(x => x.IsActive)
            .ThenByDescending(x => x.IsPrimaryRecipient)
            .ThenBy(x => x.Email)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<ContactNotificationRecipient?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ContactNotificationRecipients
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        var normalized = email.Trim().ToLowerInvariant();
        return await _context.ContactNotificationRecipients
            .AnyAsync(x => x.Email.ToLower() == normalized, cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(ContactNotificationRecipient recipient)
    {
        ArgumentNullException.ThrowIfNull(recipient);
        _context.ContactNotificationRecipients.Add(recipient);
    }

    public void Update(ContactNotificationRecipient recipient)
    {
        ArgumentNullException.ThrowIfNull(recipient);
        _context.ContactNotificationRecipients.Update(recipient);
    }
}
