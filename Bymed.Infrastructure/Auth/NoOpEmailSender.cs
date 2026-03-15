using Bymed.Application.Auth;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Auth;

// No-op email sender for development. Replace with a real implementation (e.g. SMTP) for production.
// Logs the intent to send so password reset flow can be tested.
public sealed class NoOpEmailSender : IEmailSender
{
    private readonly ILogger<NoOpEmailSender> _logger;

    public NoOpEmailSender(ILogger<NoOpEmailSender> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "NoOpEmailSender: Would send email to {ToEmail}, Subject: {Subject}. Configure a real IEmailSender for production.",
            toEmail,
            subject);
        return Task.CompletedTask;
    }
}
