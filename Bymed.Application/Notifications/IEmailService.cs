namespace Bymed.Application.Notifications;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber, CancellationToken cancellationToken = default);
    Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default);
    Task SendContactFormEmailAsync(string senderEmail, string senderName, string subject, string message, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink, CancellationToken cancellationToken = default);
}
