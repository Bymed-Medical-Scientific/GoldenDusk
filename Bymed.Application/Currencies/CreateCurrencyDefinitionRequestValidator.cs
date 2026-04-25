using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Currencies;

public sealed class CreateCurrencyDefinitionRequestValidator : AbstractValidator<CreateCurrencyDefinitionRequest>
{
    public CreateCurrencyDefinitionRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(CurrencyDefinition.CodeMaxLength);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(CurrencyDefinition.NameMaxLength);
        RuleFor(x => x.Symbol).MaximumLength(CurrencyDefinition.SymbolMaxLength);
        RuleFor(x => x.DecimalPlaces).InclusiveBetween(0, 6);
    }
}
