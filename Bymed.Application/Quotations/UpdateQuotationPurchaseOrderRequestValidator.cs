using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Quotations;

public sealed class UpdateQuotationPurchaseOrderRequestValidator : AbstractValidator<UpdateQuotationPurchaseOrderRequest>
{
    public UpdateQuotationPurchaseOrderRequestValidator()
    {
        When(
            x => x.HasPurchaseOrder,
            () =>
            {
                RuleFor(x => x.PurchaseOrderReference)
                    .NotEmpty()
                    .WithMessage("Purchase order reference is required when hasPurchaseOrder is true.")
                    .MaximumLength(Quotation.PurchaseOrderReferenceMaxLength);
            });
    }
}
