using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Users;

public sealed class UpsertAddressRequestValidator : AbstractValidator<UpsertAddressRequest>
{
    public UpsertAddressRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Address name is required.")
            .MaximumLength(Address.NameMaxLength)
            .WithMessage($"Address name must not exceed {Address.NameMaxLength} characters.");

        RuleFor(x => x.AddressLine1)
            .NotEmpty().WithMessage("Address line 1 is required.")
            .MaximumLength(Address.LineMaxLength)
            .WithMessage($"Address line 1 must not exceed {Address.LineMaxLength} characters.");

        RuleFor(x => x.AddressLine2)
            .MaximumLength(Address.LineMaxLength)
            .WithMessage($"Address line 2 must not exceed {Address.LineMaxLength} characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.AddressLine2));

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(Address.CityMaxLength)
            .WithMessage($"City must not exceed {Address.CityMaxLength} characters.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(Address.StateMaxLength)
            .WithMessage($"State must not exceed {Address.StateMaxLength} characters.");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Postal code is required.")
            .MaximumLength(Address.PostalCodeMaxLength)
            .WithMessage($"Postal code must not exceed {Address.PostalCodeMaxLength} characters.");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(Address.CountryMaxLength)
            .WithMessage($"Country must not exceed {Address.CountryMaxLength} characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required.")
            .MaximumLength(Address.PhoneMaxLength)
            .WithMessage($"Phone must not exceed {Address.PhoneMaxLength} characters.");
    }
}
