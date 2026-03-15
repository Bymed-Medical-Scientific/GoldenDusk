namespace Bymed.Application.Auth;

public sealed record ConfirmResetPasswordRequest
{
    public required string Email { get; init; }
    public required string Token { get; init; }
    public required string NewPassword { get; init; }
}
