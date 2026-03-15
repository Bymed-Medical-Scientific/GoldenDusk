namespace Bymed.Application.Auth;

public interface IRefreshTokenStore
{
    Task<string> CreateAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Guid?> ValidateAndRevokeAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task RevokeAsync(string refreshToken, CancellationToken cancellationToken = default);
}
