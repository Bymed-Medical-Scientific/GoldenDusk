namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for user login.
/// </summary>
public sealed record LoginRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}
