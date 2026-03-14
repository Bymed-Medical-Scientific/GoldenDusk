namespace Bymed.Application.Auth;

/// <summary>
/// JWT and refresh token configuration. Bound from configuration (e.g. Jwt section).
/// Secret key must be set via configuration or environment variable in production.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "BymedApi";
    public string Audience { get; set; } = "BymedApi";

    /// <summary>
    /// Access token lifetime in minutes. Design: 15 minutes.
    /// </summary>
    public int ExpirationMinutes { get; set; } = 15;

    /// <summary>
    /// Refresh token lifetime in days. Design: 7 days.
    /// </summary>
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
