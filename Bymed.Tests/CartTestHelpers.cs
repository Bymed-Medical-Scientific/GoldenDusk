using Bymed.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

internal static class CartTestHelpers
{
    public static async Task<IServiceScope> CreateScopeAsync()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync().ConfigureAwait(false);

        // In-memory SQLite enforces foreign keys by default in EF Core, but these
        // property tests don't always seed all FK principals (e.g., User records).
        // Disabling enforcement keeps tests focused on business invariants.
        using var pragma = connection.CreateCommand();
        pragma.CommandText = "PRAGMA foreign_keys = OFF;";
        await pragma.ExecuteNonQueryAsync().ConfigureAwait(false);

        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connection));
        services.AddInfrastructureRepositories();

        var provider = services.BuildServiceProvider();
        var scope = provider.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync().ConfigureAwait(false);

        return scope;
    }

    public static async Task<Guid> SeedProductAsync(
        ApplicationDbContext context,
        decimal price,
        bool isAvailable = true)
    {
        var category = new Bymed.Domain.Entities.Category(
            "Test Category",
            $"test-category-{Guid.NewGuid():N}",
            null,
            displayOrder: 0);
        context.Categories.Add(category);

        var product = new Bymed.Domain.Entities.Product(
            name: "Test Product",
            slug: $"test-product-{Guid.NewGuid():N}",
            description: "Desc",
            categoryId: category.Id,
            price: price,
            inventoryCount: 100,
            lowStockThreshold: 1,
            sku: null,
            currency: "USD",
            specifications: null);

        if (!isAvailable)
            product.MarkAsUnavailable();

        context.Products.Add(product);
        await context.SaveChangesAsync().ConfigureAwait(false);
        return product.Id;
    }

    public static void AssertCartHasSingleItem(
        Bymed.Application.Carts.CartDto dto,
        Guid productId,
        int quantity,
        decimal unitPrice)
    {
        dto.Should().NotBeNull();
        dto.Items.Should().HaveCount(1);
        dto.Items[0].ProductId.Should().Be(productId);
        dto.Items[0].Quantity.Should().Be(quantity);
        dto.Items[0].UnitPrice.Should().Be(unitPrice);
        dto.Items[0].LineTotal.Should().Be(unitPrice * quantity);
        dto.TotalItems.Should().Be(quantity);
        dto.Total.Should().Be(unitPrice * quantity);
    }
}

