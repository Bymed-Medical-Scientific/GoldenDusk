using System.ComponentModel.DataAnnotations;

namespace Bymed.Infrastructure.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    [Required]
    public string FromAddress { get; set; } = string.Empty;

    [Required]
    public string FromName { get; set; } = "Bymed";

    [Required]
    public string Host { get; set; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; set; } = 587;

    public bool UseSsl { get; set; } = true;

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string ContactFormRecipient { get; set; } = string.Empty;

    [Required]
    public string PasswordResetBaseUrl { get; set; } = string.Empty;
    [Required]
    public string EmailVerificationBaseUrl { get; set; } = string.Empty;

    /// <summary>Comma-separated addresses that receive &quot;pending admin registration&quot; emails.</summary>
    public string AdminApprovalNotifyRecipients { get; set; } = string.Empty;

    /// <summary>Base URL of the Angular admin app (used in approval notification emails).</summary>
    public string AdminPanelBaseUrl { get; set; } = string.Empty;
}
