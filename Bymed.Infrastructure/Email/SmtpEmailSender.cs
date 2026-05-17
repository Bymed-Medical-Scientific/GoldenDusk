using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Email;

public interface ISmtpEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task SendEmailAsync(
        IReadOnlyCollection<string> toEmails,
        string subject,
        string htmlBody,
        IReadOnlyCollection<string>? ccEmails = null,
        CancellationToken cancellationToken = default);

    Task SendMarketingEmailAsync(
        string toEmail,
        string fromAddress,
        string fromDisplayName,
        string subject,
        string htmlBody,
        IReadOnlyList<SmtpEmailAttachment> attachments,
        CancellationToken cancellationToken = default,
        Guid? marketingCampaignId = null);
}

public sealed class SmtpEmailSender : ISmtpEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        await SendEmailAsync([toEmail], subject, htmlBody, null, cancellationToken).ConfigureAwait(false);
    }

    public async Task SendEmailAsync(
        IReadOnlyCollection<string> toEmails,
        string subject,
        string htmlBody,
        IReadOnlyCollection<string>? ccEmails = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(toEmails);
        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        foreach (var toEmail in toEmails.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
            message.To.Add(new MailAddress(toEmail));

        foreach (var ccEmail in (ccEmails ?? Array.Empty<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
            message.CC.Add(new MailAddress(ccEmail));

        if (message.To.Count == 0)
            throw new InvalidOperationException("At least one recipient is required.");

        using var smtp = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.UseSsl,
            Credentials = new NetworkCredential(_options.Username, _options.Password)
        };

        _logger.LogInformation(
            "Sending email from {FromAddress} to {RecipientCount} recipient(s) with subject {Subject}.",
            _options.FromAddress,
            message.To.Count,
            subject);
        cancellationToken.ThrowIfCancellationRequested();
        await smtp.SendMailAsync(message).ConfigureAwait(false);
    }

    public async Task SendMarketingEmailAsync(
        string toEmail,
        string fromAddress,
        string fromDisplayName,
        string subject,
        string htmlBody,
        IReadOnlyList<SmtpEmailAttachment> attachments,
        CancellationToken cancellationToken = default,
        Guid? marketingCampaignId = null)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
            throw new ArgumentException("Recipient is required.", nameof(toEmail));
        if (string.IsNullOrWhiteSpace(fromAddress))
            throw new ArgumentException("From address is required.", nameof(fromAddress));
        if (string.IsNullOrWhiteSpace(fromDisplayName))
            fromDisplayName = fromAddress;

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress.Trim(), fromDisplayName.Trim()),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail.Trim()));

        foreach (var att in attachments ?? Array.Empty<SmtpEmailAttachment>())
        {
            if (att.Content is null || att.Content.Length == 0)
                continue;
            // Keep streams open until SendMailAsync completes; MailMessage.Dispose disposes attachments.
            var stream = new MemoryStream(att.Content, writable: false);
            message.Attachments.Add(new Attachment(stream, att.FileName, att.ContentType));
        }

        var useDedicatedMarketingSmtp = !string.IsNullOrWhiteSpace(_options.MarketingSmtpUsername) &&
            !string.IsNullOrWhiteSpace(_options.MarketingSmtpPassword);
        var smtpUser = useDedicatedMarketingSmtp ? _options.MarketingSmtpUsername : _options.Username;
        var smtpPass = useDedicatedMarketingSmtp ? _options.MarketingSmtpPassword : _options.Password;

        using var smtp = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.UseSsl,
            Credentials = new NetworkCredential(smtpUser, smtpPass)
        };

        cancellationToken.ThrowIfCancellationRequested();
        await smtp.SendMailAsync(message, cancellationToken).ConfigureAwait(false);

        if (marketingCampaignId is { } campaignId)
        {
            _logger.LogInformation(
                "Marketing campaign {MarketingCampaignId}: SMTP accepted outbound message to {RecipientEmail} (subject: {EmailSubject}, attachments: {AttachmentCount}, smtp user: {SmtpUser}).",
                campaignId,
                toEmail,
                subject,
                message.Attachments.Count,
                smtpUser);
        }
        else
        {
            _logger.LogInformation(
                "Marketing email: SMTP accepted outbound message to {RecipientEmail} (subject: {EmailSubject}, attachments: {AttachmentCount}).",
                toEmail,
                subject,
                message.Attachments.Count);
        }
    }
}
