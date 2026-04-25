namespace Bymed.Application.Auth;

public sealed record ConfirmEmailRequest
{
    public required string Email { get; init; }
    public required string Token { get; init; }
}
