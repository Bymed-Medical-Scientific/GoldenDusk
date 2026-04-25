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
    Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink);
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
        var body = BuildBrandedEmailHtml(
            preheader: $"Order confirmation for {orderNumber}",
            greetingName: customerName,
            introHtml: $"Thank you for your order <strong>{System.Net.WebUtility.HtmlEncode(orderNumber)}</strong>. We are preparing it now.",
            ctaText: null,
            ctaUrl: null,
            secondaryHtml: "We will notify you when your order ships.");

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber)
    {
        var subject = $"Your order is on the way - {orderNumber}";
        var body = BuildBrandedEmailHtml(
            preheader: $"Shipping update for order {orderNumber}",
            greetingName: customerName,
            introHtml: $"Your order <strong>{System.Net.WebUtility.HtmlEncode(orderNumber)}</strong> has shipped.",
            ctaText: null,
            ctaUrl: null,
            secondaryHtml: $"Tracking number: <strong>{System.Net.WebUtility.HtmlEncode(trackingNumber)}</strong>");

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber)
    {
        var subject = $"Delivered - {orderNumber}";
        var body = BuildBrandedEmailHtml(
            preheader: $"Order {orderNumber} delivered",
            greetingName: customerName,
            introHtml: $"Your order <strong>{System.Net.WebUtility.HtmlEncode(orderNumber)}</strong> was marked as delivered.",
            ctaText: null,
            ctaUrl: null,
            secondaryHtml: "Thank you for shopping with us.");

        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendContactFormEmailAsync(string senderEmail, string senderName, string subject, string message)
    {
        var normalizedSubject = string.IsNullOrWhiteSpace(subject) ? "Contact form message" : subject.Trim();
        var body = BuildBrandedEmailHtml(
            preheader: "New contact form message",
            greetingName: "Bymed team",
            introHtml: "New contact form message received.",
            ctaText: null,
            ctaUrl: null,
            secondaryHtml: $"""
                <strong>From:</strong> {System.Net.WebUtility.HtmlEncode(senderName)} ({System.Net.WebUtility.HtmlEncode(senderEmail)})<br/>
                <strong>Message:</strong><br/>{System.Net.WebUtility.HtmlEncode(message).Replace("\n", "<br/>")}
                """);

        await _smtpEmailSender.SendEmailAsync(_options.ContactFormRecipient, normalizedSubject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink)
    {
        var subject = "Reset your password";
        var body = BuildBrandedEmailHtml(
            preheader: "Password reset request",
            greetingName: customerName,
            introHtml: "Click the button below to reset your password.",
            ctaText: "Reset Password",
            ctaUrl: resetLink,
            secondaryHtml: "If you did not request this, you can safely ignore this email.");

        _logger.LogInformation("Queue worker sending password reset email to {RecipientEmail}.", toEmail);
        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink)
    {
        var subject = "Verify your email address";
        var body = BuildBrandedEmailHtml(
            preheader: "Verify your Bymed account",
            greetingName: customerName,
            introHtml: "Please verify your email address to continue with your account setup.",
            ctaText: "Verify Email",
            ctaUrl: verificationLink,
            secondaryHtml: "If you did not create this account, you can safely ignore this message.");

        _logger.LogInformation("Queue worker sending email verification link to {RecipientEmail}.", toEmail);
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
        var body = BuildBrandedEmailHtml(
            preheader: "Admin approval required",
            greetingName: "Admin",
            introHtml: "A new admin account was created and requires approval before sign-in.",
            ctaText: "Open Admin Panel",
            ctaUrl: adminPanelReviewHintUrl,
            secondaryHtml: $"""
                <strong>Name:</strong> {System.Net.WebUtility.HtmlEncode(pendingUserName)}<br/>
                <strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(pendingUserEmail)}
                """);

        _logger.LogInformation("Queue worker sending pending admin registration notification to {RecipientEmail}.", toEmail);
        await _smtpEmailSender.SendEmailAsync(toEmail, subject, body).ConfigureAwait(false);
    }

    private string BuildBrandedEmailHtml(
        string preheader,
        string greetingName,
        string introHtml,
        string? ctaText,
        string? ctaUrl,
        string secondaryHtml)
    {
        var safeGreetingName = System.Net.WebUtility.HtmlEncode(greetingName);
        var safeBrandName = System.Net.WebUtility.HtmlEncode(_options.FromName);
        var safePreheader = System.Net.WebUtility.HtmlEncode(preheader);
        var safeWebsite = string.IsNullOrWhiteSpace(_options.CompanyWebsiteUrl)
            ? "https://bymed.co.zw"
            : _options.CompanyWebsiteUrl.Trim();
        var safeLogoUrl = string.IsNullOrWhiteSpace(_options.LogoUrl)
            ? $"{safeWebsite.TrimEnd('/')}/images/bymed-logo.webp"
            : _options.LogoUrl.Trim();

        var ctaBlock = string.IsNullOrWhiteSpace(ctaText) || string.IsNullOrWhiteSpace(ctaUrl)
            ? string.Empty
            : $"""
                <tr>
                  <td style="padding: 6px 36px 30px;" align="center">
                    <a href="{System.Net.WebUtility.HtmlEncode(ctaUrl)}" style="display:inline-block;background:linear-gradient(90deg,#0000CC 0%,#1C4DAA 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;line-height:1;padding:14px 28px;border-radius:10px;">
                      {System.Net.WebUtility.HtmlEncode(ctaText)}
                    </a>
                  </td>
                </tr>
                """;

        var logoBlock = string.IsNullOrWhiteSpace(safeLogoUrl)
            ? $"""
                <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1;">{safeBrandName}</div>
                """
            : $"""
                <img src="{System.Net.WebUtility.HtmlEncode(safeLogoUrl)}" alt="{safeBrandName}" style="max-height:64px;max-width:280px;display:block;" />
                """;

        return $"""
            <!doctype html>
            <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{safeBrandName}</title>
              </head>
              <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{safePreheader}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:22px 10px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border-radius:14px;overflow:hidden;">
                        <tr>
                          <td style="padding:28px 28px 24px;background:linear-gradient(90deg,#0000CC 0%,#1C4DAA 100%);" align="center">
                            <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:8px 14px;">
                              {logoBlock}
                            </div>
                            <div style="margin-top:18px;font-size:38px;line-height:1.15;font-weight:800;color:#ffffff;">
                              Bymed Medical &amp; Scientific
                            </div>
                            <div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:0.5px;color:#dbeafe;">
                              Discover the unlimited possibilities
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:34px 36px 20px;background:#ffffff;">
                            <div style="font-size:44px;line-height:1.1;font-weight:800;color:#0000CC;text-align:center;">
                              {safePreheader}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:30px 40px 16px;background:#ffffff;font-size:18px;line-height:1.6;color:#1f2937;">
                            <p style="margin:0 0 18px;">Hi {safeGreetingName},</p>
                            <p style="margin:0 0 18px;">{introHtml}</p>
                            <p style="margin:0 0 18px;">{secondaryHtml}</p>
                          </td>
                        </tr>
                        {ctaBlock}
                        <tr>
                          <td style="padding:8px 40px 28px;font-size:16px;color:#4b5563;line-height:1.6;background:#ffffff;">
                            Regards,<br/>
                            <strong>{safeBrandName}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:22px 36px;background:#050505;font-size:14px;color:#f3f4f6;text-align:center;">
                            <div style="width:280px;height:2px;background:linear-gradient(90deg,#0000CC 0%,#1C4DAA 100%);margin:0 auto 16px;"></div>
                            <div>Copyright (C) {DateTime.UtcNow.Year} {safeBrandName}. All rights reserved.</div>
                            <div style="margin-top:12px;">
                              <a href="{System.Net.WebUtility.HtmlEncode(safeWebsite)}" style="color:#93c5fd;text-decoration:none;">{System.Net.WebUtility.HtmlEncode(safeWebsite)}</a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """;
    }
}
