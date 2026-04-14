namespace Bymed.Application.Auth;

public sealed record RegisterRequest
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string Name { get; init; }

    /// <summary>Defaults to storefront when omitted in JSON.</summary>
    public RegistrationChannel RegistrationChannel { get; init; } = RegistrationChannel.Storefront;
}
