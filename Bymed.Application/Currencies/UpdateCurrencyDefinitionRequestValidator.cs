using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Currencies;

public sealed class UpdateCurrencyDefinitionRequestValidator : AbstractValidator<UpdateCurrencyDefinitionRequest>
{
    public UpdateCurrencyDefinitionRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(CurrencyDefinition.NameMaxLength);
        RuleFor(x => x.Symbol).MaximumLength(CurrencyDefinition.SymbolMaxLength);
        RuleFor(x => x.DecimalPlaces).InclusiveBetween(0, 6);
    }
}
