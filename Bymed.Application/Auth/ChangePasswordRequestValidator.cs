using FluentValidation;

namespace Bymed.Application.Auth;

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    private const int MinimumPasswordLength = 8;

    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(MinimumPasswordLength).WithMessage($"New password must be at least {MinimumPasswordLength} characters.");
    }
}
