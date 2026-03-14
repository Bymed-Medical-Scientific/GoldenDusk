namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for user registration.
/// </summary>
public sealed record RegisterRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string Name { get; init; }
}
