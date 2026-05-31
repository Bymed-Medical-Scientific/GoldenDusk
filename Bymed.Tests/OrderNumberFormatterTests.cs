using Bymed.Application.Orders;
using FluentAssertions;
using Xunit;

namespace Bymed.Tests;

public sealed class OrderNumberFormatterTests
{
    [Theory]
    [InlineData("John Doe", "JD")]
    [InlineData("mary jane watson", "MJW")]
    [InlineData("Alice", "A")]
    [InlineData("", "XX")]
    [InlineData("   ", "XX")]
    public void ExtractClientInitials_ReturnsExpected(string customerName, string expected)
    {
        OrderNumberFormatter.ExtractClientInitials(customerName).Should().Be(expected);
    }

    [Fact]
    public void Format_UsesRequiredPattern()
    {
        var utc = new DateTime(2026, 5, 31, 14, 30, 0, DateTimeKind.Utc);

        var orderNumber = OrderNumberFormatter.Format(7, "John Doe", utc);

        orderNumber.Should().Be("ORD-0007-JD-26-05-31");
    }

    [Fact]
    public void Format_UsesFourDigitSequence()
    {
        var utc = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

        OrderNumberFormatter.Format(42, "Jane Doe", utc).Should().Be("ORD-0042-JD-26-01-05");
    }
}
