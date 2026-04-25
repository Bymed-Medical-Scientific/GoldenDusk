using Bymed.Application.Notifications;
using Hangfire;

namespace Bymed.Infrastructure.Email;

public sealed class HangfireEmailService : IEmailService
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireEmailService(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient ?? throw new ArgumentNullException(nameof(backgroundJobClient));
    }

    public Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendOrderConfirmationAsync(toEmail, customerName, orderNumber));
        return Task.CompletedTask;
    }

    public Task SendShippingNotificationAsync(string toEmail, string customerName, string orderNumber, string trackingNumber, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendShippingNotificationAsync(toEmail, customerName, orderNumber, trackingNumber));
        return Task.CompletedTask;
    }

    public Task SendDeliveryConfirmationAsync(string toEmail, string customerName, string orderNumber, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendDeliveryConfirmationAsync(toEmail, customerName, orderNumber));
        return Task.CompletedTask;
    }

    public Task SendContactFormEmailAsync(
        string senderEmail,
        string senderName,
        string subject,
        string message,
        IReadOnlyCollection<string> toRecipients,
        IReadOnlyCollection<string> ccRecipients,
        CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendContactFormEmailAsync(senderEmail, senderName, subject, message, toRecipients.ToArray(), ccRecipients.ToArray()));
        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendPasswordResetEmailAsync(toEmail, customerName, resetLink));
        return Task.CompletedTask;
    }

    public Task SendEmailVerificationAsync(string toEmail, string customerName, string verificationLink, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendEmailVerificationAsync(toEmail, customerName, verificationLink));
        return Task.CompletedTask;
    }

    public Task SendPendingAdminRegistrationNotificationAsync(
        string toEmail,
        string pendingUserName,
        string pendingUserEmail,
        string adminPanelReviewHintUrl,
        CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Enqueue<IEmailBackgroundJobRunner>(runner =>
            runner.SendPendingAdminRegistrationNotificationAsync(toEmail, pendingUserName, pendingUserEmail, adminPanelReviewHintUrl));
        return Task.CompletedTask;
    }
}
