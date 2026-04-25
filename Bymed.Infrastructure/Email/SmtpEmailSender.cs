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

        _logger.LogInformation("Sending email to {RecipientCount} recipient(s) with subject {Subject}.", message.To.Count, subject);
        cancellationToken.ThrowIfCancellationRequested();
        await smtp.SendMailAsync(message).ConfigureAwait(false);
    }
}
