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
/// Property 45: Category-Product Relationship.
/// For any category query, the returned category should include all products that reference that category via foreign key.
/// Validates: Requirements 1.2 (product catalog / category relationship).
/// </summary>
public class CategoryProductRelationshipPropertyTests
{
    private const string ValidSlug = "valid-product-slug";
    private const string ValidName = "Product Name";
    private const string ValidDescription = "Description";

    // Feature: bymed-website, Property 45: Category-Product Relationship
    // For any categoryId, every product created with that categoryId has CategoryId equal to that categoryId.
    [Property(MaxTest = 100)]
    public Property Product_CategoryId_IdentifiesRelationship_ToCategory()
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

    // Feature: bymed-website, Property 45: Category-Product Relationship
    // Products with the same CategoryId belong to the same category (relationship consistency).
    [Property(MaxTest = 100)]
    public Property Products_WithSameCategoryId_BelongToSameCategory()
    {
        var nonEmptyGuid = ArbMap.Default.GeneratorFor<Guid>().Where(id => id != Guid.Empty).ToArbitrary();
        return Prop.ForAll(nonEmptyGuid, categoryId =>
        {
            var p1 = new Product("A", "slug-a", "Desc", categoryId, 1m, 1, 0);
            var p2 = new Product("B", "slug-b", "Desc", categoryId, 2m, 1, 0);
            return p1.CategoryId == p2.CategoryId && p1.CategoryId == categoryId;
        });
    }

    /// <summary>
    /// Integration: Querying products by category returns exactly all products that reference that category via foreign key.
    /// Validates that the persistence layer (EF Core) preserves the Category-Product relationship for queries.
    /// </summary>
    [Fact]
    public void QueryingProductsByCategory_ShouldReturnAllProductsThatReferenceThatCategory()
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
        var productIds = new List<Guid>();

        using (var context = new ApplicationDbContext(options))
        {
            var category = new Category("Test Category", "test-category", null, 0);
            categoryId = category.Id;
            context.Categories.Add(category);
            context.SaveChanges();

            for (var i = 0; i < 5; i++)
            {
                var product = new Product(
                    $"Product {i}",
                    $"test-product-{i}",
                    "Desc",
                    categoryId,
                    (decimal)(i + 1),
                    10,
                    2);
                productIds.Add(product.Id);
                context.Products.Add(product);
            }
            context.SaveChanges();
        }

        using (var context = new ApplicationDbContext(options))
        {
            var category = context.Categories.Find(categoryId);
            category.Should().NotBeNull();

            var productsInCategory = context.Products
                .Where(p => p.CategoryId == categoryId)
                .ToList();

            productsInCategory.Should().HaveCount(5, "we added exactly 5 products for this category");
            productsInCategory.Select(p => p.Id).Should().BeEquivalentTo(productIds);
            productsInCategory.Should().OnlyContain(p => p.CategoryId == categoryId);
        }
    }
}
