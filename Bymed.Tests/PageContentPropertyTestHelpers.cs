using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Shared SQLite setup for PageContent property tests (Property 23, 24).
/// </summary>
internal static class PageContentPropertyTestHelpers
{
    /// <summary>
    /// Creates an in-memory SQLite database with the full schema and CMS repositories.
    /// </summary>
    public static (IServiceScope Scope, IPageContentRepository Repo, IUnitOfWork Uow, ApplicationDbContext Db) CreatePageContentScope()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        using (var pragma = connection.CreateCommand())
        {
            pragma.CommandText = "PRAGMA foreign_keys = OFF;";
            pragma.ExecuteNonQuery();
        }

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connection));
        services.AddInfrastructureRepositories();

        var provider = services.BuildServiceProvider();
        var scope = provider.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureCreated();

        var repo = scope.ServiceProvider.GetRequiredService<IPageContentRepository>();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        return (scope, repo, uow, db);
    }
}
