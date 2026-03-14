namespace Bymed.Application.Auth;

/// <summary>
/// Response DTO for token refresh (new access and refresh tokens).
/// </summary>
public sealed record RefreshTokenResponse
{
    public required string Token { get; init; }
    public required string RefreshToken { get; init; }
}
