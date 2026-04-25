using FluentValidation;

namespace Bymed.Application.Contact;

public sealed class CreateContactNotificationRecipientRequestValidator : AbstractValidator<CreateContactNotificationRecipientRequest>
{
    public CreateContactNotificationRecipientRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.")
            .EmailAddress().WithMessage("Email format is invalid.");
    }
}
