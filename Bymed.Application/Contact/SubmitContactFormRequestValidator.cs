using FluentValidation;

namespace Bymed.Application.Contact;

public sealed class SubmitContactFormRequestValidator : AbstractValidator<SubmitContactFormRequest>
{
    public SubmitContactFormRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.")
            .EmailAddress().WithMessage("Email format is invalid.");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required.")
            .MaximumLength(200).WithMessage("Subject must not exceed 200 characters.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required.")
            .MaximumLength(5000).WithMessage("Message must not exceed 5000 characters.");
    }
}
