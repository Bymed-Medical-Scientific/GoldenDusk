using Bymed.Application.Common;
using Bymed.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bymed.Tests;

public class UniqueSlugGeneratorTests
{
    [Fact]
    public async Task GenerateUniqueAsync_WhenBaseSlugFree_ReturnsBaseSlug()
    {
        var slug = await UniqueSlugGenerator.GenerateUniqueAsync(
            "Infusion Pump",
            Product.SlugMaxLength,
            "product",
            (_, _) => Task.FromResult(false));

        slug.Should().Be("infusion-pump");
    }

    [Fact]
    public async Task GenerateUniqueAsync_WhenBaseSlugTaken_AppendsNumericSuffix()
    {
        var taken = new HashSet<string>(StringComparer.Ordinal) { "infusion-pump" };

        var slug = await UniqueSlugGenerator.GenerateUniqueAsync(
            "Infusion Pump",
            Product.SlugMaxLength,
            "product",
            (candidate, _) => Task.FromResult(taken.Contains(candidate)));

        slug.Should().Be("infusion-pump-2");
    }

    [Fact]
    public async Task GenerateUniqueAsync_WhenNameHasNoSlugCharacters_UsesFallback()
    {
        var slug = await UniqueSlugGenerator.GenerateUniqueAsync(
            "***",
            Product.SlugMaxLength,
            "product",
            (_, _) => Task.FromResult(false));

        slug.Should().Be("product");
    }
}
