using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Clients;

public sealed class ClientContactPersonRequestValidator : AbstractValidator<ClientContactPersonRequest>
{
    public ClientContactPersonRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Contact person name is required.")
            .MaximumLength(ClientContactPerson.NameMaxLength);

        RuleFor(x => x.Email)
            .MaximumLength(ClientContactPerson.EmailMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(ClientContactPerson.PhoneMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.Faculty)
            .MaximumLength(ClientContactPerson.FacultyMaxLength)
            .When(x => !string.IsNullOrWhiteSpace(x.Faculty));
    }
}

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

        RuleFor(x => x.Email).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Phone));
        RuleFor(x => x.Telephone).MaximumLength(Client.TelephoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Telephone));

        RuleForEach(x => x.ContactPersons).SetValidator(new ClientContactPersonRequestValidator())
            .When(x => x.ContactPersons is { Count: > 0 });
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

        RuleFor(x => x.Email).MaximumLength(Client.EmailMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(Client.PhoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Phone));
        RuleFor(x => x.Telephone).MaximumLength(Client.TelephoneMaxLength).When(x => !string.IsNullOrWhiteSpace(x.Telephone));

        RuleForEach(x => x.ContactPersons).SetValidator(new ClientContactPersonRequestValidator())
            .When(x => x.ContactPersons is { Count: > 0 });
    }
}
