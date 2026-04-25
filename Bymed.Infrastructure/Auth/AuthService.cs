using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Bymed.Application.Auth;
using Bymed.Application.Common;
using Bymed.Application.Notifications;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure.Email;
using Bymed.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Bymed.Infrastructure.Auth;
public sealed class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwtSettings;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IRefreshTokenStore refreshTokenStore,
        IEmailService emailService,
        IOptions<JwtSettings> jwtSettings,
        IOptions<EmailOptions> emailOptions,
        ILogger<AuthService> logger)
    {
        _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _refreshTokenStore = refreshTokenStore ?? throw new ArgumentNullException(nameof(refreshTokenStore));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _jwtSettings = jwtSettings?.Value ?? throw new ArgumentNullException(nameof(jwtSettings));
        _emailOptions = emailOptions?.Value ?? throw new ArgumentNullException(nameof(emailOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result<AuthResponse>.Failure("Invalid request.");

        var email = request.Email?.Trim();
        if (string.IsNullOrEmpty(email))
            return Result<AuthResponse>.Failure("Email is required.");
        if (string.IsNullOrEmpty(request.Password))
            return Result<AuthResponse>.Failure("Password is required.");
        if (!PasswordPolicy.MeetsComplexity(request.Password))
            return Result<AuthResponse>.Failure(PasswordPolicy.ComplexityDescription);
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<AuthResponse>.Failure("Name is required.");

        var existingUser = await _userRepository.GetByEmailAsync(email, cancellationToken).ConfigureAwait(false);
        if (existingUser != null)
            return Result<AuthResponse>.Failure("A user with this email already exists.");

        var hasExistingUsers = await _userRepository.AnyAsync(cancellationToken).ConfigureAwait(false);

        UserRole role;
        bool isActive;
        switch (request.RegistrationChannel)
        {
            case RegistrationChannel.Storefront:
                role = UserRole.Customer;
                isActive = false;
                break;
            case RegistrationChannel.AdminPanel:
                role = UserRole.Admin;
                isActive = false;
                break;
            default:
                return Result<AuthResponse>.Failure("Invalid registration channel.");
        }

        var appUser = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            Name = request.Name.Trim(),
            Role = role,
            EmailConfirmed = false,
            IsActive = isActive
        };

        var createResult = await _userManager.CreateAsync(appUser, request.Password).ConfigureAwait(false);
        if (!createResult.Succeeded)
            return Result<AuthResponse>.Failure(createResult.Errors.FirstOrDefault()?.Description ?? "Registration failed.");

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var userId = Guid.Parse(appUser.Id);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result<AuthResponse>.Failure("User was created but could not be retrieved.");

        await SendVerificationEmailAsync(appUser, cancellationToken).ConfigureAwait(false);
        var pendingAdminApproval = request.RegistrationChannel == RegistrationChannel.AdminPanel;

        return Result<AuthResponse>.Success(new AuthResponse
        {
            User = ToAuthUserDto(user),
            Token = null,
            RefreshToken = null,
            PendingAdminApproval = pendingAdminApproval
        });
    }

    public async Task<Result> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result.Failure("Invalid request.");

        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email))
            return Result.Failure("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Token))
            return Result.Failure("Token is required.");

        var appUser = await _userManager.FindByEmailAsync(email).ConfigureAwait(false);
        if (appUser is null)
            return Result.Failure("Invalid or expired verification link.");

        if (!appUser.EmailConfirmed)
        {
            var identityResult = await _userManager.ConfirmEmailAsync(appUser, request.Token).ConfigureAwait(false);
            if (!identityResult.Succeeded)
                return Result.Failure("Invalid or expired verification link.");
        }

        if (!Guid.TryParse(appUser.Id, out var userId))
            return Result.Failure("Invalid user.");

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);
        if (user is null)
            return Result.Failure("User not found.");

        if (!user.EmailConfirmed)
            user.SetEmailConfirmed(true);

        if (user.Role == UserRole.Customer)
        {
            if (!user.IsActive)
                user.SetActive(true);
        }
        else if (user.Role == UserRole.Admin && !user.IsActive)
        {
            var approverEmails = await _userRepository
                .GetEmailsByRoleAndActiveAsync(UserRole.Admin, isActive: true, excludeUserId: user.Id, cancellationToken)
                .ConfigureAwait(false);
            await NotifyApproversOfPendingAdminAsync(user, approverEmails, cancellationToken).ConfigureAwait(false);
        }

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result<AuthResponse>.Failure("Invalid request.");

        var email = request.Email?.Trim();
        if (string.IsNullOrEmpty(email))
            return Result<AuthResponse>.Failure("Email is required.");
        if (string.IsNullOrEmpty(request.Password))
            return Result<AuthResponse>.Failure("Password is required.");

        var appUser = await _userManager.FindByEmailAsync(email).ConfigureAwait(false);
        if (appUser == null)
        {
            _logger.LogWarning("Login failed: no account for normalized email.");
            return Result<AuthResponse>.Failure("Invalid email or password.");
        }

        if (await _userManager.IsLockedOutAsync(appUser).ConfigureAwait(false))
        {
            _logger.LogWarning("Login failed: account locked for user {UserId}.", appUser.Id);
            return Result<AuthResponse>.Failure("Account is locked. Try again later.");
        }

        var isValid = await _userManager.CheckPasswordAsync(appUser, request.Password).ConfigureAwait(false);
        if (!isValid)
        {
            await _userManager.AccessFailedAsync(appUser).ConfigureAwait(false);
            await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogWarning("Login failed: invalid password for user {UserId}.", appUser.Id);
            return Result<AuthResponse>.Failure("Invalid email or password.");
        }

        await _userManager.ResetAccessFailedCountAsync(appUser).ConfigureAwait(false);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var user = await _userRepository.GetByIdAsync(Guid.Parse(appUser.Id), cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result<AuthResponse>.Failure("User could not be loaded.");

        if (!user.EmailConfirmed)
        {
            _logger.LogWarning("Login failed: email not verified for user {UserId}.", appUser.Id);
            return Result<AuthResponse>.Failure("Please verify your email before signing in.");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: inactive account for user {UserId}.", appUser.Id);
            return Result<AuthResponse>.Failure(
                "Your account is not active yet. If you registered from the admin site, an administrator must approve your access before you can sign in.");
        }

        var token = GenerateAccessToken(user);
        var refreshToken = await _refreshTokenStore.CreateAsync(user.Id, cancellationToken).ConfigureAwait(false);

        return Result<AuthResponse>.Success(new AuthResponse
        {
            User = ToAuthUserDto(user),
            Token = token,
            RefreshToken = refreshToken,
            PendingAdminApproval = false
        });
    }

    public async Task<Result<RefreshTokenResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
            return Result<RefreshTokenResponse>.Failure("Refresh token is required.");

        var userId = await _refreshTokenStore.ValidateAndRevokeAsync(request.RefreshToken, cancellationToken).ConfigureAwait(false);
        if (userId == null)
            return Result<RefreshTokenResponse>.Failure("Invalid or expired refresh token.");

        var user = await _userRepository.GetByIdAsync(userId.Value, cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result<RefreshTokenResponse>.Failure("User not found.");

        if (!user.IsActive)
            return Result<RefreshTokenResponse>.Failure("Account is not active.");

        var token = GenerateAccessToken(user);
        var newRefreshToken = await _refreshTokenStore.CreateAsync(user.Id, cancellationToken).ConfigureAwait(false);

        return Result<RefreshTokenResponse>.Success(new RefreshTokenResponse
        {
            Token = token,
            RefreshToken = newRefreshToken
        });
    }

    public async Task<Result> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Result.Success();

        await _refreshTokenStore.RevokeAsync(refreshToken, cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }

    public async Task<Result> RequestPasswordResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result.Success();

        var email = request.Email?.Trim();
        if (string.IsNullOrEmpty(email))
            return Result.Success();

        var user = await _userRepository.GetByEmailAsync(email, cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result.Success(); // Do not reveal whether email exists.

        var appUser = new ApplicationUser
        {
            Id = user.Id.ToString(),
            UserName = user.Email,
            Name = user.Name,
            Role = user.Role,
            EmailConfirmed = user.EmailConfirmed,
            IsActive = user.IsActive,
            PasswordHash = user.PasswordHash
        };

        var token = await _userManager.GeneratePasswordResetTokenAsync(appUser).ConfigureAwait(false);
        if (string.IsNullOrEmpty(token))
            return Result.Success();

        var baseUrl = _emailOptions.PasswordResetBaseUrl.TrimEnd('/');
        var resetLink = $"{baseUrl}?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        await _emailService.SendPasswordResetEmailAsync(email, user.Name, resetLink, cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }

    public async Task<Result> ConfirmPasswordResetAsync(ConfirmResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result.Failure("Invalid request.");

        var email = request.Email?.Trim();
        if (string.IsNullOrEmpty(email))
            return Result.Failure("Email is required.");
        if (string.IsNullOrEmpty(request.Token))
            return Result.Failure("Token is required.");
        if (string.IsNullOrEmpty(request.NewPassword))
            return Result.Failure("New password is required.");
        if (!PasswordPolicy.MeetsComplexity(request.NewPassword))
            return Result.Failure(PasswordPolicy.ComplexityDescription);

        var user = await _userRepository.GetByEmailAsync(email, cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result.Failure("Invalid or expired reset link.");

        var appUser = new ApplicationUser
        {
            Id = user.Id.ToString(),
            UserName = user.Email,
            Name = user.Name,
            Role = user.Role,
            EmailConfirmed = user.EmailConfirmed,
            IsActive = user.IsActive,
            PasswordHash = user.PasswordHash
        };

        var result = await _userManager.ResetPasswordAsync(appUser, request.Token, request.NewPassword).ConfigureAwait(false);
        if (!result.Succeeded)
            return Result.Failure(result.Errors.FirstOrDefault()?.Description ?? "Password reset failed.");

        return Result.Success();
    }

    public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            return Result.Failure("Invalid request.");
        if (string.IsNullOrEmpty(request.CurrentPassword))
            return Result.Failure("Current password is required.");
        if (string.IsNullOrEmpty(request.NewPassword))
            return Result.Failure("New password is required.");
        if (!PasswordPolicy.MeetsComplexity(request.NewPassword))
            return Result.Failure(PasswordPolicy.ComplexityDescription);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Result.Failure("User not found.");

        var appUser = new ApplicationUser
        {
            Id = user.Id.ToString(),
            UserName = user.Email,
            Name = user.Name,
            Role = user.Role,
            EmailConfirmed = user.EmailConfirmed,
            IsActive = user.IsActive,
            PasswordHash = user.PasswordHash
        };

        var result = await _userManager.ChangePasswordAsync(appUser, request.CurrentPassword, request.NewPassword).ConfigureAwait(false);
        if (!result.Succeeded)
            return Result.Failure(result.Errors.FirstOrDefault()?.Description ?? "Password change failed.");

        return Result.Success();
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes);
        var token = new JwtSecurityToken(
            _jwtSettings.Issuer,
            _jwtSettings.Audience,
            claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static AuthUserDto ToAuthUserDto(User user)
    {
        return new AuthUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            EmailConfirmed = user.EmailConfirmed,
            IsActive = user.IsActive
        };
    }

    private async Task SendVerificationEmailAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user).ConfigureAwait(false);
        var baseUrl = _emailOptions.EmailVerificationBaseUrl.TrimEnd('/');
        var verificationLink = $"{baseUrl}?email={Uri.EscapeDataString(user.UserName ?? string.Empty)}&token={Uri.EscapeDataString(token)}";

        await _emailService
            .SendEmailVerificationAsync(user.UserName ?? string.Empty, user.Name ?? user.UserName ?? "User", verificationLink, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task NotifyApproversOfPendingAdminAsync(User pendingUser, IReadOnlyList<string> approverEmails, CancellationToken cancellationToken)
    {
        var recipients = ParseRecipientEmailList(_emailOptions.AdminApprovalNotifyRecipients);
        recipients.AddRange(approverEmails);
        recipients = recipients
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(email => !email.Equals(pendingUser.Email, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (recipients.Count == 0)
        {
            _logger.LogWarning(
                "Pending admin registration for {Email} but Email:AdminApprovalNotifyRecipients is empty; no notification email sent.",
                pendingUser.Email);
            return;
        }

        var baseUrl = _emailOptions.AdminPanelBaseUrl?.Trim() ?? string.Empty;
        var reviewHintUrl = string.IsNullOrEmpty(baseUrl)
            ? "https://localhost:4200/login"
            : $"{baseUrl.TrimEnd('/')}/login?pendingAdminUserId={pendingUser.Id}";

        foreach (var to in recipients)
        {
            await _emailService
                .SendPendingAdminRegistrationNotificationAsync(to, pendingUser.Name, pendingUser.Email, reviewHintUrl, cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static List<string> ParseRecipientEmailList(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return new List<string>();

        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => s.Contains('@', StringComparison.Ordinal))
            .ToList();
    }
}
