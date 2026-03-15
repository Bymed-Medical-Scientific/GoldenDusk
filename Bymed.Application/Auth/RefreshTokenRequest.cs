namespace Bymed.Application.Auth;

public sealed record RefreshTokenRequest
{
    public required string RefreshToken { get; init; }
}
