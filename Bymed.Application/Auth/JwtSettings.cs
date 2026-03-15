namespace Bymed.Application.Auth;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "BymedApi";
    public string Audience { get; set; } = "BymedApi";

    public int ExpirationMinutes { get; set; } = 15;

    public int RefreshTokenExpirationDays { get; set; } = 7;
}
