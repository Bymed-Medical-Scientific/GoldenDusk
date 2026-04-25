namespace Bymed.Application.Notifications;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber, CancellationToken cancellationToken = default);
    Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendContactFormEmailAsync(string senderEmail, string senderName, string subject, string message, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink, CancellationToken cancellationToken = default);
    Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink, CancellationToken cancellationToken = default);

    /// <summary>Notifies configured admin recipient(s) that a new admin registration is waiting for approval.</summary>
    Task SendPendingAdminRegistrationNotificationAsync(
        string toEmail,
        string pendingUserName,
        string pendingUserEmail,
        string adminPanelReviewHintUrl,
        CancellationToken cancellationToken = default);
}
