using FluentValidation;

namespace Bymed.Application.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public const int MinimumPasswordLength = PasswordPolicy.MinimumLength;
    public const int EmailMaxLength = 256;
    public const int NameMaxLength = 200;

    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(EmailMaxLength).WithMessage($"Email must not exceed {EmailMaxLength} characters.")
            .Must(BeValidEmailFormat).WithMessage("Email must be a valid email address.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(MinimumPasswordLength).WithMessage($"Password must be at least {MinimumPasswordLength} characters.")
            .Must(PasswordPolicy.MeetsComplexity).WithMessage(PasswordPolicy.ComplexityDescription);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(NameMaxLength).WithMessage($"Name must not exceed {NameMaxLength} characters.");

        RuleFor(x => x.RegistrationChannel)
            .IsInEnum().WithMessage("Registration channel is invalid.");
    }

    private static bool BeValidEmailFormat(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;
        var atIndex = email.IndexOf('@');
        return atIndex > 0 && atIndex < email.Length - 1 && email.IndexOf('@', atIndex + 1) < 0;
    }
}
