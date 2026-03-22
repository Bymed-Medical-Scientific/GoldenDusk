using FluentValidation;

namespace Bymed.Application.Auth;

public sealed class ConfirmResetPasswordRequestValidator : AbstractValidator<ConfirmResetPasswordRequest>
{
    private const int EmailMaxLength = 256;

    public ConfirmResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(EmailMaxLength).WithMessage($"Email must not exceed {EmailMaxLength} characters.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Token is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(PasswordPolicy.MinimumLength).WithMessage($"New password must be at least {PasswordPolicy.MinimumLength} characters.")
            .Must(PasswordPolicy.MeetsComplexity).WithMessage(PasswordPolicy.ComplexityDescription);
    }
}
