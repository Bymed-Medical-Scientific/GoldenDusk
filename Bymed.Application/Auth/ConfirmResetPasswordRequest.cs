namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for confirming password reset with token from email.
/// </summary>
public sealed record ConfirmResetPasswordRequest
{
    public required string Email { get; init; }
    public required string Token { get; init; }
    public required string NewPassword { get; init; }
}
