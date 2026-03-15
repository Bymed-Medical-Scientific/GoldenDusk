namespace Bymed.Application.Auth;

public sealed record AuthResponse
{
    public required AuthUserDto User { get; init; }
    public required string Token { get; init; }
    public required string RefreshToken { get; init; }
}
