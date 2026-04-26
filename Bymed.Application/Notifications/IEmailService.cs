namespace Bymed.Application.Notifications;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber, CancellationToken cancellationToken = default);
    Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendContactFormEmailAsync(
        string senderEmail,
        string senderName,
        string organization,
        string subject,
        string message,
        IReadOnlyCollection<string> toRecipients,
        IReadOnlyCollection<string> ccRecipients,
        CancellationToken cancellationToken = default);
    Task SendQuoteRequestSubmittedEmailAsync(
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
        CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink, CancellationToken cancellationToken = default);
    Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink, CancellationToken cancellationToken = default);
    Task SendCustomerAccountUnderReviewEmailAsync(string toEmail, string customerName, CancellationToken cancellationToken = default);

    /// <summary>Notifies configured admin recipient(s) that a new admin registration is waiting for approval.</summary>
    Task SendPendingAdminRegistrationNotificationAsync(
        string toEmail,
        string pendingUserName,
        string pendingUserEmail,
        string adminPanelReviewHintUrl,
        CancellationToken cancellationToken = default);
}
