namespace Bymed.Application.Quotations;

public interface IPricingCalculator
{
    PricingResult Calculate(
        decimal supplierUnitCost,
        decimal exchangeRateToTarget,
        decimal markupMultiplier,
        decimal vatPercent,
        int quantity);
}

public sealed record PricingResult(
    decimal UnitPriceExcludingVat,
    decimal UnitVatAmount,
    decimal UnitPriceIncludingVat,
    decimal LineSubtotalExcludingVat,
    decimal LineVatAmount,
    decimal LineTotalIncludingVat);

public sealed class PricingCalculator : IPricingCalculator
{
    public PricingResult Calculate(
        decimal supplierUnitCost,
        decimal exchangeRateToTarget,
        decimal markupMultiplier,
        decimal vatPercent,
        int quantity)
    {
        if (supplierUnitCost < 0m)
            throw new ArgumentOutOfRangeException(nameof(supplierUnitCost), "Supplier unit cost cannot be negative.");
        if (exchangeRateToTarget <= 0m)
            throw new ArgumentOutOfRangeException(nameof(exchangeRateToTarget), "Exchange rate must be greater than zero.");
        if (markupMultiplier <= 0m)
            throw new ArgumentOutOfRangeException(nameof(markupMultiplier), "Markup multiplier must be greater than zero.");
        if (vatPercent < 0m || vatPercent > 100m)
            throw new ArgumentOutOfRangeException(nameof(vatPercent), "VAT percent must be between 0 and 100.");
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");

        var convertedUnitCost = supplierUnitCost * exchangeRateToTarget;
        var unitExVatRaw = convertedUnitCost * markupMultiplier;
        var unitVatRaw = unitExVatRaw * (vatPercent / 100m);
        var unitIncVatRaw = unitExVatRaw + unitVatRaw;

        var unitExVat = decimal.Round(unitExVatRaw, 2, MidpointRounding.AwayFromZero);
        var unitVat = decimal.Round(unitVatRaw, 2, MidpointRounding.AwayFromZero);
        var unitIncVat = decimal.Round(unitIncVatRaw, 2, MidpointRounding.AwayFromZero);

        return new PricingResult(
            unitExVat,
            unitVat,
            unitIncVat,
            decimal.Round(unitExVat * quantity, 2, MidpointRounding.AwayFromZero),
            decimal.Round(unitVat * quantity, 2, MidpointRounding.AwayFromZero),
            decimal.Round(unitIncVat * quantity, 2, MidpointRounding.AwayFromZero));
    }
}
