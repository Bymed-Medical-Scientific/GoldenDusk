namespace Bymed.Application.Auth;

/// <summary>
/// Response DTO for register and login (user, access token, refresh token).
/// </summary>
public sealed record AuthResponse
{
    public required AuthUserDto User { get; init; }
    public required string Token { get; init; }
    public required string RefreshToken { get; init; }
}
