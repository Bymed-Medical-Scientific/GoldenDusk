using Bymed.Application.Common;

namespace Bymed.Application.Auth;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<Result> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default);

    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<Result<RefreshTokenResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    Task<Result> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<Result> RequestPasswordResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task<Result> ConfirmPasswordResetAsync(ConfirmResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
}
