using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Quotations;

public sealed class UpsertQuotationItemRequestValidator : AbstractValidator<UpsertQuotationItemRequest>
{
    public UpsertQuotationItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ProductNameSnapshot).NotEmpty().MaximumLength(QuotationItem.ProductNameMaxLength);
        RuleFor(x => x.ProductSkuSnapshot).MaximumLength(QuotationItem.ProductSkuMaxLength);
        RuleFor(x => x.ProductImageUrlSnapshot).MaximumLength(QuotationItem.ProductImageUrlMaxLength);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.SupplierUnitCost).GreaterThanOrEqualTo(0m);
        RuleFor(x => x.SourceCurrencyCode).NotEmpty().MaximumLength(QuotationItem.CurrencyCodeMaxLength);
        RuleFor(x => x.ExchangeRateToTarget).GreaterThan(0m);
        RuleFor(x => x.MarkupMultiplier).GreaterThan(0m);
    }
}
