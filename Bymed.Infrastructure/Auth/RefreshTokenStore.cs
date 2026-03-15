using System.Security.Cryptography;
using Bymed.Application.Auth;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Auth;

public sealed class RefreshTokenStore : IRefreshTokenStore
{
    private readonly ApplicationDbContext _context;
    private readonly JwtSettings _settings;

    public RefreshTokenStore(ApplicationDbContext context, IOptions<JwtSettings> settings)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
    }

    public async Task<string> CreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var token = GenerateSecureToken();
        var hash = HashToken(token);
        var expiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays);

        _context.RefreshTokens.Add(new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = hash,
            ExpiresAt = expiresAt
        });
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return token;
    }

    public async Task<Guid?> ValidateAndRevokeAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return null;

        var hash = HashToken(refreshToken);
        var entity = await _context.RefreshTokens
            .FirstOrDefaultAsync(
                rt => rt.TokenHash == hash && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow,
                cancellationToken)
            .ConfigureAwait(false);

        if (entity == null)
            return null;

        entity.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return entity.UserId;
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;

        var hash = HashToken(refreshToken);
        var entity = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == hash && rt.RevokedAt == null, cancellationToken)
            .ConfigureAwait(false);

        if (entity != null)
        {
            entity.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
