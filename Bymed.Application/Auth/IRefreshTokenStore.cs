namespace Bymed.Application.Auth;

/// <summary>
/// Stores and validates refresh tokens. Supports token rotation (consume old, issue new).
/// </summary>
public interface IRefreshTokenStore
{
    /// <summary>
    /// Creates and stores a new refresh token for the user. Returns the token to send to the client.
    /// </summary>
    Task<string> CreateAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates the refresh token and revokes it (one-time use). Returns the user id if valid; null otherwise.
    /// </summary>
    Task<Guid?> ValidateAndRevokeAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes the given refresh token (e.g. on logout).
    /// </summary>
    Task RevokeAsync(string refreshToken, CancellationToken cancellationToken = default);
}
