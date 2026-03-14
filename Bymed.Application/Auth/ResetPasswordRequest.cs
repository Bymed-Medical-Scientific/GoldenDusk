namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for requesting a password reset (sends email with token).
/// </summary>
public sealed record ResetPasswordRequest
{
    public required string Email { get; init; }
}
