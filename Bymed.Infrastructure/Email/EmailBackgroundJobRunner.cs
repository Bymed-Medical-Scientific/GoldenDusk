using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Email;

public interface IEmailBackgroundJobRunner
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber);
    Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber);
    Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber);
    Task SendContactFormEmailAsync(string senderEmail, string senderName, string subject, string message);
    Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink);
    Task SendPendingAdminRegistrationNotificationAsync(string toEmail, string pendingUserName, string pendingUserEmail, string adminPanelReviewHintUrl);
}

public sealed class EmailBackgroundJobRunner : IEmailBackgroundJobRunner
{
    private readonly ISmtpEmailSender _smtpEmailSender;
    private readonly EmailOptions _options;
    private readonly ILogger<EmailBackgroundJobRunner> _logger;

    public EmailBackgroundJobRunner(
        ISmtpEmailSender smtpEmailSender,
        IOptions<EmailOptions> options,
        ILogger<EmailBackgroundJobRunner> logger)
    {
        _smtpEmailSender = smtpEmailSender ?? throw new ArgumentNullException(nameof(smtpEmailSender));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber)
    {
        var subject = $"Order confirmation - {orderNumber}";
        var body = $"""
            <p>Hi {customerName},</p>
            <p>Thank you for your order <strong>{orderNumber}</strong>. We are preparing it now.</p>
            <p>Regards,<br/>{_options.FromName}</p>
            """;

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber)
    {
        var subject = $"Your order is on the way - {orderNumber}";
        var body = $"""
            <p>Hi {customerName},</p>
            <p>Your order <strong>{orderNumber}</strong> has shipped.</p>
            <p>Tracking number: <strong>{trackingNumber}</strong></p>
            <p>Regards,<br/>{_options.FromName}</p>
            """;

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber)
    {
        var subject = $"Delivered - {orderNumber}";
        var body = $"""
            <p>Hi {customerName},</p>
            <p>Your order <strong>{orderNumber}</strong> was marked as delivered.</p>
            <p>Thank you for shopping with us.</p>
            <p>Regards,<br/>{_options.FromName}</p>
            """;

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendContactFormEmailAsync(string senderEmail, string senderName, string subject, string message)
    {
        var normalizedSubject = string.IsNullOrWhiteSpace(subject) ? "Contact form message" : subject.Trim();
        var body = $"""
            <p>New contact form message received.</p>
            <p><strong>From:</strong> {senderName} ({senderEmail})</p>
            <p><strong>Message:</strong></p>
            <p>{System.Net.WebUtility.HtmlEncode(message).Replace("\n", "<br/>")}</p>
            """;

        await _smtpEmailSender.SendEmailAsync(_options.ContactFormRecipient, normalizedSubject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink)
    {
        var subject = "Reset your password";
        var body = $"""
            <p>Hi {customerName},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{resetLink}">Reset Password</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>Regards,<br/>{_options.FromName}</p>
            """;

        _logger.LogInformation("Queue worker sending password reset email to {RecipientEmail}.", toEmail);
        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendPendingAdminRegistrationNotificationAsync(
        string toEmail,
        string pendingUserName,
        string pendingUserEmail,
        string adminPanelReviewHintUrl)
    {
        var subject = "New admin registration pending approval";
        var body = $"""
            <p>A new admin account was created and requires your approval before they can sign in.</p>
            <p><strong>Name:</strong> {System.Net.WebUtility.HtmlEncode(pendingUserName)}<br/>
            <strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(pendingUserEmail)}</p>
            <p>Open the admin panel to review pending users. Hint link: <a href="{System.Net.WebUtility.HtmlEncode(adminPanelReviewHintUrl)}">{System.Net.WebUtility.HtmlEncode(adminPanelReviewHintUrl)}</a></p>
            <p>Regards,<br/>{_options.FromName}</p>
            """;

        _logger.LogInformation("Queue worker sending pending admin registration notification to {RecipientEmail}.", toEmail);
        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }
}
