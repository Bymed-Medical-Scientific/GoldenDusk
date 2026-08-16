using Bymed.Application.Common;
using Bymed.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bymed.Tests;

public class SlugGeneratorTests
{
    [Fact]
    public void FromName_ComplexEquipmentTitle_ProducesUrlSafeSlug()
    {
        const string name =
            "AFTC - Computer Controlled Fluid Friction in Pipes, with Hydraulics Bench (FME00)";

        var slug = SlugGenerator.FromName(name, CatalogueItem.SlugMaxLength);

        slug.Should().Be(
            "aftc-computer-controlled-fluid-friction-in-pipes-with-hydraulics-bench-fme00");
    }

    [Fact]
    public void FromName_WhenCollision_AppendsNumericSuffixWithinMaxLength()
    {
        const string baseSlug = "lab-microscope";

        var withSuffix = SlugGenerator.WithNumericSuffix(baseSlug, 2, CatalogueItem.SlugMaxLength);

        withSuffix.Should().Be("lab-microscope-2");
    }

    [Fact]
    public void FromName_WhenOnlySymbols_ReturnsEmpty()
    {
        SlugGenerator.FromName("***", CatalogueItem.SlugMaxLength).Should().BeEmpty();
    }
}
