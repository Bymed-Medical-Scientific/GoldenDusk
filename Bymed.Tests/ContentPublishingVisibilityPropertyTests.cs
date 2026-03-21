using Bymed.Application.PageContent;
using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 23: Content Publishing Visibility.
/// For any content change that is published, the updated content should be visible in customer-facing page queries.
/// Validates: Requirements 8.3
/// </summary>
public class ContentPublishingVisibilityPropertyTests
{
    /// <summary>
    /// Non-empty body text within a reasonable size for CMS pages.
    /// </summary>
    private static readonly Arbitrary<string> PageBodyArb =
        ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrEmpty(s) && s.Length <= 20_000)
            .ToArbitrary();

    // Feature: bymed-website, Property 23: Content Publishing Visibility
    [Property(MaxTest = 40)]
    public Property PublishedPage_AfterUpdate_GetPageBySlug_ReturnsUpdatedContent()
    {
        return Prop.ForAll(PageBodyArb, PageBodyArb, (initialContent, updatedContent) =>
        {
            var (scope, repo, uow, db) = PageContentPropertyTestHelpers.CreatePageContentScope();
            using (scope)
            {
                var slug = $"page-{Guid.NewGuid():N}";
                var page = new PageContent(slug, "Property 23 Title", initialContent);
                page.Publish();
                db.PageContents.Add(page);
                db.SaveChanges();

                page.IsPublished.Should().BeTrue("seed page must be published for requirement 8.3");

                var updateHandler = new UpdatePageContentCommandHandler(repo, uow);
                var updateResult = updateHandler.Handle(
                    new UpdatePageContentCommand(
                        slug,
                        new UpdatePageContentRequest { Content = updatedContent },
                        "admin@example.com"),
                    CancellationToken.None).GetAwaiter().GetResult();

                updateResult.IsSuccess.Should().BeTrue(updateResult.Error ?? "");

                var getHandler = new GetPageBySlugQueryHandler(repo);
                var getResult = getHandler.Handle(new GetPageBySlugQuery(slug), CancellationToken.None).GetAwaiter().GetResult();

                getResult.IsSuccess.Should().BeTrue(getResult.Error ?? "");
                getResult.Value.Should().NotBeNull();
                getResult.Value!.Content.Should().Be(updatedContent);
                getResult.Value.IsPublished.Should().BeTrue("published page remains visible after update");
                getResult.Value.Slug.Should().Be(slug);
            }

            return true;
        });
    }
}
