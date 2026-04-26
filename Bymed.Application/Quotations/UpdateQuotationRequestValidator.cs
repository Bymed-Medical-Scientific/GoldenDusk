using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Quotations;

public sealed class UpdateQuotationRequestValidator : AbstractValidator<UpdateQuotationRequest>
{
    public UpdateQuotationRequestValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(Quotation.CustomerNameMaxLength);
        RuleFor(x => x.CustomerInstitution).NotEmpty().MaximumLength(Quotation.CustomerInstitutionMaxLength);
        RuleFor(x => x.CustomerEmail).NotEmpty().MaximumLength(Quotation.CustomerEmailMaxLength).EmailAddress();
        RuleFor(x => x.CustomerPhone).NotEmpty().MaximumLength(Quotation.CustomerPhoneMaxLength);
        RuleFor(x => x.CustomerAddress).NotEmpty().MaximumLength(Quotation.CustomerAddressMaxLength);
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(Quotation.SubjectMaxLength);
        RuleFor(x => x.TargetCurrencyCode).NotEmpty().MaximumLength(Quotation.CurrencyCodeMaxLength);
        RuleFor(x => x.VatPercent).InclusiveBetween(0m, 100m);
        RuleFor(x => x.Notes).MaximumLength(Quotation.NotesMaxLength);
        RuleFor(x => x.TermsAndConditions).MaximumLength(Quotation.TermsMaxLength);
    }
}
