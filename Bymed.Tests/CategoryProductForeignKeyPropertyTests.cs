using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Property 44: Category Foreign Key Integrity.
/// For any product, the CategoryId should reference a valid Category record in the database.
/// Deleting a category with associated products should be prevented.
/// Validates: Requirements 6.2
/// </summary>
public class CategoryProductForeignKeyPropertyTests
{
    private const string ValidSlug = "valid-product-slug";
    private const string ValidName = "Product Name";
    private const string ValidDescription = "Description";

    // Feature: bymed-website, Property 44: Category Foreign Key Integrity
    [Property(MaxTest = 100)]
    public Property Product_CategoryId_ShouldMatchConstructorCategoryId()
    {
        var nonEmptyGuid = ArbMap.Default.GeneratorFor<Guid>().Where(id => id != Guid.Empty).ToArbitrary();
        return Prop.ForAll(nonEmptyGuid, categoryId =>
        {
            var product = new Product(
                ValidName,
                ValidSlug,
                ValidDescription,
                categoryId,
                price: 10m,
                inventoryCount: 5,
                lowStockThreshold: 2);

            return product.CategoryId == categoryId;
        });
    }

    // Feature: bymed-website, Property 44: Category Foreign Key Integrity (non-empty invariant)
    [Property(MaxTest = 100)]
    public Property Product_CategoryId_ShouldNeverBeEmpty_WhenCreatedWithValidCategoryId()
    {
        var nonEmptyGuid = ArbMap.Default.GeneratorFor<Guid>().Where(id => id != Guid.Empty).ToArbitrary();
        return Prop.ForAll(nonEmptyGuid, categoryId =>
        {
            var product = new Product(
                ValidName,
                ValidSlug,
                ValidDescription,
                categoryId,
                price: 1m,
                inventoryCount: 1,
                lowStockThreshold: 0);

            return product.CategoryId != Guid.Empty;
        });
    }

    /// <summary>
    /// Integration-style check: deleting a category that has products should be prevented by the database (Restrict).
    /// Validates the EF Core configuration of Category-Product FK with OnDelete(DeleteBehavior.Restrict).
    /// </summary>
    [Fact]
    public void DeletingCategoryWithProducts_ShouldThrow()
    {
        using var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        connection.Open();
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = "PRAGMA foreign_keys = ON;";
            cmd.ExecuteNonQuery();
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        using (var context = new ApplicationDbContext(options))
        {
            context.Database.EnsureCreated();
        }

        Guid categoryId;
        using (var context = new ApplicationDbContext(options))
        {
            var category = new Category("Test Category", "test-category", null, 0);
            categoryId = category.Id;
            context.Categories.Add(category);
            context.SaveChanges();

            var product = new Product(
                "Test Product",
                "test-product",
                "Desc",
                categoryId,
                9.99m,
                10,
                2);
            context.Products.Add(product);
            context.SaveChanges();
        }

        using (var context = new ApplicationDbContext(options))
        {
            var category = context.Categories.Find(categoryId);
            category.Should().NotBeNull();
            context.Categories.Remove(category!);

            var act = () => context.SaveChanges();
            var exception = act.Should().Throw<DbUpdateException>().Which;
            var message = exception.Message + (exception.InnerException?.Message ?? "");
            message.ToUpperInvariant().Should().Contain("FOREIGN KEY", because: "FK restrict should report constraint violation");
        }
    }
}
