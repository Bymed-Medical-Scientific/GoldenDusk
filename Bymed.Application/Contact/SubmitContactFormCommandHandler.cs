using System.Net.Mail;
using Bymed.Application.Common;
using Bymed.Application.Notifications;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class SubmitContactFormCommandHandler : IRequestHandler<SubmitContactFormCommand, Result<ContactFormDto>>
{
    private const int NameMaxLength = 100;
    private const int EmailMaxLength = 254;
    private const int SubjectMaxLength = 200;
    private const int MessageMaxLength = 5000;

    private readonly IEmailService _emailService;

    public SubmitContactFormCommandHandler(IEmailService emailService)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public async Task<Result<ContactFormDto>> Handle(SubmitContactFormCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request;

        var name = payload.Name?.Trim() ?? string.Empty;
        var email = payload.Email?.Trim() ?? string.Empty;
        var subject = payload.Subject?.Trim() ?? string.Empty;
        var message = payload.Message?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
            return Result<ContactFormDto>.Failure("Name is required.");
        if (name.Length > NameMaxLength)
            return Result<ContactFormDto>.Failure($"Name must not exceed {NameMaxLength} characters.");

        if (string.IsNullOrWhiteSpace(email))
            return Result<ContactFormDto>.Failure("Email is required.");
        if (email.Length > EmailMaxLength)
            return Result<ContactFormDto>.Failure($"Email must not exceed {EmailMaxLength} characters.");
        if (!IsValidEmail(email))
            return Result<ContactFormDto>.Failure("Email format is invalid.");

        if (string.IsNullOrWhiteSpace(subject))
            return Result<ContactFormDto>.Failure("Subject is required.");
        if (subject.Length > SubjectMaxLength)
            return Result<ContactFormDto>.Failure($"Subject must not exceed {SubjectMaxLength} characters.");

        if (string.IsNullOrWhiteSpace(message))
            return Result<ContactFormDto>.Failure("Message is required.");
        if (message.Length > MessageMaxLength)
            return Result<ContactFormDto>.Failure($"Message must not exceed {MessageMaxLength} characters.");

        await _emailService
            .SendContactFormEmailAsync(email, name, subject, message, cancellationToken)
            .ConfigureAwait(false);

        return Result<ContactFormDto>.Success(new ContactFormDto
        {
            Name = name,
            Email = email,
            Subject = subject,
            Message = message,
            SubmittedAtUtc = DateTime.UtcNow
        });
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
