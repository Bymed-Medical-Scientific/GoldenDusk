namespace Bymed.Application.Auth;

/// <summary>
/// Sends emails (e.g. password reset link). Implement in Infrastructure.
/// </summary>
public interface IEmailSender
{
    /// <summary>
    /// Sends an email. Subject and body are pre-built by the caller.
    /// </summary>
    Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default);
}
