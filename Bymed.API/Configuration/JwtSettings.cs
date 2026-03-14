namespace Bymed.API.Configuration;

/// <summary>
/// JWT authentication settings. Secret key should be set via environment variable in production.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    /// <summary>
    /// Secret key for signing tokens. Must be set via configuration or environment variable (e.g. Jwt__SecretKey).
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Token issuer (e.g. the API base URL or application name).
    /// </summary>
    public string Issuer { get; set; } = "BymedApi";

    /// <summary>
    /// Intended audience for the token.
    /// </summary>
    public string Audience { get; set; } = "BymedApi";

    /// <summary>
    /// Token lifetime in minutes.
    /// </summary>
    public int ExpirationMinutes { get; set; } = 60;
}
