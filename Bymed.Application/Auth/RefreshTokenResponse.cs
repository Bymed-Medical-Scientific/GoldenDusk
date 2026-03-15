namespace Bymed.Application.Auth;

public sealed record RefreshTokenResponse
{
    public required string Token { get; init; }
    public required string RefreshToken { get; init; }
}
