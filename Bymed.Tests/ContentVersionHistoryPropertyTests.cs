using Bymed.Application.PageContent;
using Bymed.Domain.Entities;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Tests;

/// <summary>
/// Property 24: Content Version History.
/// For any content update, a new version record should be created with the previous content, timestamp, and author.
/// Validates: Requirements 8.4
/// </summary>
public class ContentVersionHistoryPropertyTests
{
    private static readonly Arbitrary<string> PageBodyArb =
        ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrEmpty(s) && s.Length <= 20_000)
            .ToArbitrary();

    private static readonly Arbitrary<string> AuthorArb =
        ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s) && s.Trim().Length <= ContentVersion.CreatedByMaxLength)
            .Select(s => s.Trim())
            .ToArbitrary();

    // Feature: bymed-website, Property 24: Content Version History
    [Property(MaxTest = 40)]
    public Property ContentUpdate_CreatesVersionWithPreviousContentTimestampAndAuthor()
    {
        return Prop.ForAll(PageBodyArb, PageBodyArb, AuthorArb, (initialContent, updatedContent, modifiedBy) =>
        {
            var (scope, repo, uow, db) = PageContentPropertyTestHelpers.CreatePageContentScope();
            using (scope)
            {
                var slug = $"page-{Guid.NewGuid():N}";
                var page = new PageContent(slug, "Property 24 Title", initialContent);
                db.PageContents.Add(page);
                db.SaveChanges();

                var beforeUpdate = DateTime.UtcNow.AddSeconds(-2);

                var updateHandler = new UpdatePageContentCommandHandler(repo, uow);
                var updateResult = updateHandler.Handle(
                    new UpdatePageContentCommand(
                        slug,
                        new UpdatePageContentRequest { Content = updatedContent },
                        modifiedBy),
                    CancellationToken.None).GetAwaiter().GetResult();

                updateResult.IsSuccess.Should().BeTrue(updateResult.Error ?? "");

                var afterUpdate = DateTime.UtcNow.AddSeconds(2);

                var versions = db.ContentVersions
                    .AsNoTracking()
                    .Where(v => v.PageContentId == page.Id)
                    .ToList();

                versions.Should().ContainSingle("exactly one version snapshot per update");
                var v = versions[0];
                v.Content.Should().Be(initialContent, "version must store the previous body before the update");
                v.CreatedBy.Should().Be(modifiedBy);
                v.CreatedAt.Should().BeOnOrAfter(beforeUpdate);
                v.CreatedAt.Should().BeOnOrBefore(afterUpdate);
            }

            return true;
        });
    }
}
