using Bymed.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Persistence;

public static class ContactNotificationRecipientSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(logger);

        if (await db.ContactNotificationRecipients.AnyAsync(cancellationToken).ConfigureAwait(false))
            return;

        db.ContactNotificationRecipients.AddRange(
            new ContactNotificationRecipient("info@bymed.co.zw", isPrimaryRecipient: true),
            new ContactNotificationRecipient("nmalaba@bymed.co.zw", isPrimaryRecipient: false),
            new ContactNotificationRecipient("ttmalaba@bymed.co.zw", isPrimaryRecipient: false));

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Seeded default contact notification recipients.");
    }
}
