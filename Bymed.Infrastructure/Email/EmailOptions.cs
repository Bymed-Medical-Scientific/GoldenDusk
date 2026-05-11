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

    /// <summary>
    /// Optional admin-specific reset-password page URL.
    /// Falls back to <see cref="PasswordResetBaseUrl"/> when empty.
    /// </summary>
    public string AdminPasswordResetBaseUrl { get; set; } = string.Empty;
    [Required]
    public string EmailVerificationBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Optional admin-specific verify-email page URL.
    /// Falls back to <see cref="EmailVerificationBaseUrl"/> when empty.
    /// </summary>
    public string AdminEmailVerificationBaseUrl { get; set; } = string.Empty;

    /// <summary>Comma-separated addresses that receive &quot;pending admin registration&quot; emails.</summary>
    public string AdminApprovalNotifyRecipients { get; set; } = string.Empty;

    /// <summary>Base URL of the Angular admin app (used in approval notification emails).</summary>
    public string AdminPanelBaseUrl { get; set; } = string.Empty;

    /// <summary>Optional public logo URL used in branded email templates.</summary>
    public string LogoUrl { get; set; } = string.Empty;

    /// <summary>Optional company website shown in email footers.</summary>
    public string CompanyWebsiteUrl { get; set; } = string.Empty;

    /// <summary>Optional From address for bulk marketing campaigns. Falls back to <see cref="FromAddress"/> when empty.</summary>
    public string MarketingFromAddress { get; set; } = string.Empty;

    /// <summary>Optional display name for marketing From. Falls back to <see cref="FromName"/> when empty.</summary>
    public string MarketingFromName { get; set; } = string.Empty;

    /// <summary>
    /// Optional SMTP login for marketing sends only. When both this and <see cref="MarketingSmtpPassword"/> are set,
    /// marketing mail authenticates with this pair; otherwise <see cref="Username"/> / <see cref="Password"/> are used.
    /// </summary>
    public string MarketingSmtpUsername { get; set; } = string.Empty;

    /// <summary>Password for <see cref="MarketingSmtpUsername"/>.</summary>
    public string MarketingSmtpPassword { get; set; } = string.Empty;
}
