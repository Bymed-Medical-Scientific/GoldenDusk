using FluentValidation;

namespace Bymed.Application.ClientErrors;

public sealed class LogAdminClientErrorRequestValidator : AbstractValidator<LogAdminClientErrorRequest>
{
    private const int MessageMaxLength = 2000;
    private const int StackMaxLength = 16000;
    private const int UrlMaxLength = 2000;
    private const int ComponentMaxLength = 500;

    public LogAdminClientErrorRequestValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Message is required.")
            .MaximumLength(MessageMaxLength)
            .WithMessage($"Message must not exceed {MessageMaxLength} characters.");

        RuleFor(x => x.StackTrace)
            .MaximumLength(StackMaxLength)
            .WithMessage($"Stack trace must not exceed {StackMaxLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.StackTrace));

        RuleFor(x => x.PageUrl)
            .MaximumLength(UrlMaxLength)
            .WithMessage($"Page URL must not exceed {UrlMaxLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.PageUrl));

        RuleFor(x => x.ComponentName)
            .MaximumLength(ComponentMaxLength)
            .WithMessage($"Component name must not exceed {ComponentMaxLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.ComponentName));
    }
}
