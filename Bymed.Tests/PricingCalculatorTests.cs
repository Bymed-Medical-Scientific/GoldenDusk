using Bymed.Application.Quotations;
using FluentAssertions;
using Xunit;

namespace Bymed.Tests;

public sealed class PricingCalculatorTests
{
    [Fact]
    public void Calculate_WithVatEnabled_ComputesExpectedTotals()
    {
        var sut = new PricingCalculator();

        var result = sut.Calculate(
            supplierUnitCost: 100m,
            exchangeRateToTarget: 1.5m,
            markupMultiplier: 2.2m,
            vatPercent: 15.5m,
            quantity: 3);

        result.UnitPriceExcludingVat.Should().Be(330.00m);
        result.UnitVatAmount.Should().Be(51.15m);
        result.UnitPriceIncludingVat.Should().Be(381.15m);
        result.LineSubtotalExcludingVat.Should().Be(990.00m);
        result.LineVatAmount.Should().Be(153.45m);
        result.LineTotalIncludingVat.Should().Be(1143.45m);
    }

    [Fact]
    public void Calculate_WithZeroVat_KeepsExVatEqualToIncVat()
    {
        var sut = new PricingCalculator();

        var result = sut.Calculate(50m, 2m, 2m, 0m, 4);

        result.UnitPriceExcludingVat.Should().Be(200m);
        result.UnitVatAmount.Should().Be(0m);
        result.UnitPriceIncludingVat.Should().Be(200m);
        result.LineSubtotalExcludingVat.Should().Be(800m);
        result.LineVatAmount.Should().Be(0m);
        result.LineTotalIncludingVat.Should().Be(800m);
    }
}
