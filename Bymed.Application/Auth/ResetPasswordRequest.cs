namespace Bymed.Application.Auth;

public sealed record ResetPasswordRequest
{
    public required string Email { get; init; }
}
