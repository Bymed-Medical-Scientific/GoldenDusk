using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Clients;

public sealed class CreateClientRequestValidator : AbstractValidator<CreateClientRequest>
{
    public CreateClientRequestValidator()
    {
        RuleFor(x => x.InstitutionName)
            .NotEmpty().WithMessage("Institution name is required.")
            .MaximumLength(Client.InstitutionNameMaxLength);

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(Client.AddressMaxLength);

        RuleFor(x => x.ClientTypeId)
            .NotEqual(Guid.Empty).WithMessage("Client type is required.");

        RuleFor(x => x.Email1).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email1));
        RuleFor(x => x.Email2).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email2));
        RuleFor(x => x.Email3).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email3));
        RuleFor(x => x.ContactPerson1Email).MaximumLength(Client.EmailMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Email));
        RuleFor(x => x.ContactPerson2Email).MaximumLength(Client.EmailMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Email));

        RuleFor(x => x.PhoneNumber1).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber1));
        RuleFor(x => x.PhoneNumber2).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber2));
        RuleFor(x => x.PhoneNumber3).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber3));

        RuleFor(x => x.TelephoneNumber1).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber1));
        RuleFor(x => x.TelephoneNumber2).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber2));
        RuleFor(x => x.TelephoneNumber3).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber3));
        RuleFor(x => x.ContactPerson1Telephone).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Telephone));
        RuleFor(x => x.ContactPerson2Telephone).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Telephone));

        RuleFor(x => x.ContactPerson1Name).MaximumLength(Client.ContactPersonNameMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Name));
        RuleFor(x => x.ContactPerson2Name).MaximumLength(Client.ContactPersonNameMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Name));
    }
}

public sealed class UpdateClientRequestValidator : AbstractValidator<UpdateClientRequest>
{
    public UpdateClientRequestValidator()
    {
        RuleFor(x => x.InstitutionName)
            .NotEmpty().WithMessage("Institution name is required.")
            .MaximumLength(Client.InstitutionNameMaxLength);

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(Client.AddressMaxLength);

        RuleFor(x => x.ClientTypeId)
            .NotEqual(Guid.Empty).WithMessage("Client type is required.");

        RuleFor(x => x.Email1).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email1));
        RuleFor(x => x.Email2).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email2));
        RuleFor(x => x.Email3).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email3));
        RuleFor(x => x.ContactPerson1Email).MaximumLength(Client.EmailMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Email));
        RuleFor(x => x.ContactPerson2Email).MaximumLength(Client.EmailMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Email));

        RuleFor(x => x.PhoneNumber1).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber1));
        RuleFor(x => x.PhoneNumber2).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber2));
        RuleFor(x => x.PhoneNumber3).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber3));

        RuleFor(x => x.TelephoneNumber1).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber1));
        RuleFor(x => x.TelephoneNumber2).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber2));
        RuleFor(x => x.TelephoneNumber3).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.TelephoneNumber3));
        RuleFor(x => x.ContactPerson1Telephone).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Telephone));
        RuleFor(x => x.ContactPerson2Telephone).MaximumLength(Client.TelephoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Telephone));

        RuleFor(x => x.ContactPerson1Name).MaximumLength(Client.ContactPersonNameMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson1Name));
        RuleFor(x => x.ContactPerson2Name).MaximumLength(Client.ContactPersonNameMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPerson2Name));
    }
}
