using Bymed.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Persistence;

/// <summary>
/// Inserts default CMS rows when the database is empty so admin and storefront have pages to edit.
/// Content is minimal JSON <c>{}</c>; the Next.js storefront merges with built-in marketing defaults.
/// </summary>
public static class PageContentSeeder
{
    private const string EmptyMarketingJson = "{}";

    public static async Task SeedAsync(ApplicationDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (await db.PageContents.AnyAsync(cancellationToken).ConfigureAwait(false))
            return;

        logger.LogInformation("Seeding default PageContents (home, about, services).");

        var utc = DateTime.UtcNow;
        var pages = new[]
        {
            new PageContent("home", "Home", EmptyMarketingJson),
            new PageContent("about", "About us", EmptyMarketingJson),
            new PageContent("services", "Services", EmptyMarketingJson)
        };

        foreach (var p in pages)
            p.Publish();

        db.PageContents.AddRange(pages);
        foreach (var p in pages)
            db.Entry(p).Property("CreationTime").CurrentValue = utc;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
