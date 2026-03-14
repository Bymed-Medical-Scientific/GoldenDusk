namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for refreshing the access token.
/// </summary>
public sealed record RefreshTokenRequest
{
    public required string RefreshToken { get; init; }
}
