namespace Bymed.Infrastructure.Persistence;

/// <summary>
/// Persistence model for refresh tokens. Stored hashed; one-time use with rotation.
/// </summary>
public sealed class RefreshTokenEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    /// <summary>Hash of the token (never store plaintext).</summary>
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
