using FluentValidation;

namespace Bymed.Application.Auth;

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(PasswordPolicy.MinimumLength).WithMessage($"New password must be at least {PasswordPolicy.MinimumLength} characters.")
            .Must(PasswordPolicy.MeetsComplexity).WithMessage(PasswordPolicy.ComplexityDescription);
    }
}
