using System.Net.Mail;
using Bymed.Application.Common;
using Bymed.Application.Notifications;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class SubmitContactFormCommandHandler : IRequestHandler<SubmitContactFormCommand, Result<ContactFormDto>>
{
    private const int NameMaxLength = 100;
    private const int EmailMaxLength = 254;
    private const int OrganizationMaxLength = 200;
    private const int SubjectMaxLength = 200;
    private const int MessageMaxLength = 5000;

    private readonly IEmailService _emailService;
    private readonly IContactMessageRepository _contactMessageRepository;
    private readonly IContactNotificationRecipientRepository _contactNotificationRecipientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitContactFormCommandHandler(
        IEmailService emailService,
        IContactMessageRepository contactMessageRepository,
        IContactNotificationRecipientRepository contactNotificationRecipientRepository,
        IUnitOfWork unitOfWork)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _contactMessageRepository = contactMessageRepository ?? throw new ArgumentNullException(nameof(contactMessageRepository));
        _contactNotificationRecipientRepository = contactNotificationRecipientRepository ?? throw new ArgumentNullException(nameof(contactNotificationRecipientRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ContactFormDto>> Handle(SubmitContactFormCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request;

        var name = payload.Name?.Trim() ?? string.Empty;
        var email = payload.Email?.Trim() ?? string.Empty;
        var organization = payload.Organization?.Trim() ?? string.Empty;
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

        if (organization.Length > OrganizationMaxLength)
            return Result<ContactFormDto>.Failure($"Organization must not exceed {OrganizationMaxLength} characters.");

        if (string.IsNullOrWhiteSpace(subject))
            return Result<ContactFormDto>.Failure("Subject is required.");
        if (subject.Length > SubjectMaxLength)
            return Result<ContactFormDto>.Failure($"Subject must not exceed {SubjectMaxLength} characters.");

        if (string.IsNullOrWhiteSpace(message))
            return Result<ContactFormDto>.Failure("Message is required.");
        if (message.Length > MessageMaxLength)
            return Result<ContactFormDto>.Failure($"Message must not exceed {MessageMaxLength} characters.");

        var submittedAtUtc = DateTime.UtcNow;
        var contactMessage = new ContactMessage(name, email, organization, subject, message, submittedAtUtc);
        _contactMessageRepository.Add(contactMessage);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var configuredRecipients = await _contactNotificationRecipientRepository
            .GetActiveAsync(cancellationToken)
            .ConfigureAwait(false);
        var toRecipients = configuredRecipients
            .Where(x => x.IsPrimaryRecipient)
            .Select(x => x.Email)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var ccRecipients = configuredRecipients
            .Where(x => !x.IsPrimaryRecipient)
            .Select(x => x.Email)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Keep recipients sourced from active Contact Notification Recipients only.
        if (toRecipients.Count == 0 && ccRecipients.Count > 0)
        {
            toRecipients.Add(ccRecipients[0]);
            ccRecipients.RemoveAt(0);
        }

        await _emailService
            .SendContactFormEmailAsync(email, name, organization, subject, message, toRecipients, ccRecipients, cancellationToken)
            .ConfigureAwait(false);

        return Result<ContactFormDto>.Success(new ContactFormDto
        {
            Name = name,
            Email = email,
            Organization = organization,
            Subject = subject,
            Message = message,
            SubmittedAtUtc = submittedAtUtc
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
