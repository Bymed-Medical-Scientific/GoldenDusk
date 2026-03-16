using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Application.Products;
using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using NSubstitute;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 1: Category Filtering Completeness.
/// For any selected categoryId, filtering products by that categoryId should
/// return only products from that category, and include all such products.
/// Validates: Requirements 1.2 (product catalog category filtering).
/// </summary>
public class CategoryFilteringCompletenessPropertyTests
{
    private static IProductRepository CreateProductRepository() => Substitute.For<IProductRepository>();

    // Feature: bymed-website, Property 1: Category Filtering Completeness
    // For any categoryId, GetProductsQuery with that categoryId returns only products with that CategoryId.
    [Property(MaxTest = 100)]
    public Property GetProductsQuery_WithCategoryFilter_ReturnsOnlyThatCategory()
    {
        var nonEmptyGuid = ArbMap.Default.GeneratorFor<Guid>().Where(id => id != Guid.Empty).ToArbitrary();
        return Prop.ForAll(nonEmptyGuid, categoryId =>
        {
            var repo = CreateProductRepository();

            var allProducts = new List<Product>
            {
                new("P1", "p1-slug", "Desc", categoryId, 10m, 5, 1),
                new("P2", "p2-slug", "Desc", categoryId, 20m, 5, 1),
                new("Other", "other-slug", "Desc", Guid.NewGuid(), 30m, 5, 1)
            };

            var pagination = new PaginationParams(1, 50);
            repo.GetPagedAsync(pagination, categoryId, Arg.Any<bool?>(), Arg.Any<CancellationToken>())
                .Returns(ci =>
                {
                    var filtered = allProducts.Where(p => p.CategoryId == categoryId).ToList();
                    return new PagedResult<Product>(filtered, pagination.PageNumber, pagination.PageSize, filtered.Count);
                });

            var handler = new GetProductsQueryHandler(repo);
            var query = new GetProductsQuery(1, 50, categoryId, null, null);
            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.Items.Should().NotBeNullOrEmpty();
            result.Items.Should().OnlyContain(p => p.CategoryId == categoryId);

            var expectedCount = allProducts.Count(p => p.CategoryId == categoryId);
            result.TotalCount.Should().Be(expectedCount);
        });
    }
}
