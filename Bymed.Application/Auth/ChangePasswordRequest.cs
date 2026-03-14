namespace Bymed.Application.Auth;

/// <summary>
/// Request DTO for changing password (authenticated user).
/// </summary>
public sealed record ChangePasswordRequest
{
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
}
