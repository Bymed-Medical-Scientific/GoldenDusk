namespace Bymed.Application.Auth;

public sealed record AuthResponse
{
    public required AuthUserDto User { get; init; }

    /// <summary>Null when <see cref="PendingAdminApproval"/> is true.</summary>
    public string? Token { get; init; }

    /// <summary>Null when <see cref="PendingAdminApproval"/> is true.</summary>
    public string? RefreshToken { get; init; }

    /// <summary>Admin-panel registration is saved but not signed in until an admin approves.</summary>
    public bool PendingAdminApproval { get; init; }
}
