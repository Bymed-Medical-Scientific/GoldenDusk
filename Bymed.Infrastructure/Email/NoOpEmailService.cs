using Bymed.Application.Notifications;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Email;

public sealed class NoOpEmailService : IEmailService
{
    private readonly ILogger<NoOpEmailService> _logger;

    public NoOpEmailService(ILogger<NoOpEmailService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default)
        => LogAsync("OrderConfirmation", toEmail);

    public Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber, CancellationToken cancellationToken = default)
        => LogAsync("ShippingNotification", toEmail);

    public Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default)
        => LogAsync("DeliveryConfirmation", toEmail);

    public Task SendContactFormEmailAsync(
        string senderEmail,
        string senderName,
        string organization,
        string subject,
        string message,
        IReadOnlyCollection<string> toRecipients,
        IReadOnlyCollection<string> ccRecipients,
        CancellationToken cancellationToken = default)
        => LogAsync("ContactForm", string.Join(",", toRecipients));

    public Task SendQuoteRequestSubmittedEmailAsync(
        Guid quoteRequestId,
        string fullName,
        string institution,
        string email,
        string phoneNumber,
        string address,
        string notes,
        IReadOnlyCollection<(string ProductName, string ProductSku, int Quantity)> items,
        IReadOnlyCollection<string> toRecipients,
        IReadOnlyCollection<string> ccRecipients,
        CancellationToken cancellationToken = default)
        => LogAsync("QuoteRequestSubmitted", string.Join(",", toRecipients));

    public Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink, CancellationToken cancellationToken = default)
        => LogAsync("PasswordReset", toEmail);

    public Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink, CancellationToken cancellationToken = default)
        => LogAsync("EmailVerification", toEmail);

    public Task SendCustomerAccountUnderReviewEmailAsync(string toEmail, string customerName, CancellationToken cancellationToken = default)
        => LogAsync("CustomerAccountUnderReview", toEmail);

    public Task SendPendingAdminRegistrationNotificationAsync(
        string toEmail,
        string pendingUserName,
        string pendingUserEmail,
        string adminPanelReviewHintUrl,
        CancellationToken cancellationToken = default)
        => LogAsync("PendingAdminRegistration", toEmail);

    private Task LogAsync(string template, string email)
    {
        _logger.LogInformation("NoOpEmailService invoked for {Template} to {Email}.", template, email);
        return Task.CompletedTask;
    }
}
