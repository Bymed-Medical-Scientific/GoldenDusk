using FluentValidation;

namespace Bymed.Application.Auth;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    private const int EmailMaxLength = 256;

    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(EmailMaxLength).WithMessage($"Email must not exceed {EmailMaxLength} characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}
