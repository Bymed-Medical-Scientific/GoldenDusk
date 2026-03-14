using Bymed.Application.Common;

namespace Bymed.Application.Auth;

/// <summary>
/// Application service for authentication: registration, login, refresh token, logout, and password reset.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user with email validation. Returns user info and tokens on success.
    /// </summary>
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Authenticates the user and returns access and refresh tokens.
    /// </summary>
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Exchanges a valid refresh token for new access and refresh tokens (rotation).
    /// </summary>
    Task<Result<RefreshTokenResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes the given refresh token (logout).
    /// </summary>
    Task<Result> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Requests a password reset: generates token and sends email. Always returns success to avoid email enumeration.
    /// </summary>
    Task<Result> RequestPasswordResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Confirms password reset using the token sent by email.
    /// </summary>
    Task<Result> ConfirmPasswordResetAsync(ConfirmResetPasswordRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes password for the authenticated user identified by userId.
    /// </summary>
    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
}
