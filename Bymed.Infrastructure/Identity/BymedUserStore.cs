using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;
using Microsoft.AspNetCore.Identity;

namespace Bymed.Infrastructure.Identity;

/// <summary>
/// ASP.NET Core Identity user store that persists to the domain User entity via IUserRepository.
/// Maps between ApplicationUser (Identity) and User (domain). UserName is used as email.
/// </summary>
public sealed class BymedUserStore : IUserStore<ApplicationUser>,
    IUserPasswordStore<ApplicationUser>,
    IUserEmailStore<ApplicationUser>
{
    private readonly IUserRepository _userRepository;

    public BymedUserStore(IUserRepository userRepository)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public void Dispose()
    {
        // No unmanaged resources; repository is scoped.
    }

    public Task<string> GetUserIdAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.Id);
    }

    public Task<string?> GetUserNameAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.UserName);
    }

    public Task SetUserNameAsync(ApplicationUser user, string? userName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.UserName = userName;
        return Task.CompletedTask;
    }

    public Task<string?> GetNormalizedUserNameAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(NormalizeEmail(user.UserName));
    }

    public Task SetNormalizedUserNameAsync(ApplicationUser user, string? normalizedName, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        // We store email as UserName; normalized form is lowercase. No separate column.
        user.UserName = normalizedName;
        return Task.CompletedTask;
    }

    public async Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(user.UserName))
            return IdentityResult.Failed(new IdentityError { Description = "Email (UserName) is required." });

        var existing = await _userRepository.GetByEmailAsync(user.UserName.Trim(), cancellationToken).ConfigureAwait(false);
        if (existing != null)
            return IdentityResult.Failed(new IdentityError { Code = "DuplicateEmail", Description = "A user with this email already exists." });

        var id = Guid.TryParse(user.Id, out var guid) ? guid : Guid.NewGuid();
        user.Id = id.ToString();

        var domainUser = new User(
            user.UserName.Trim(),
            user.Name ?? user.UserName.Trim(),
            user.Role);
        domainUser.PrepareEntityForCreate(new Account(id));

        // Placeholder hash; UserManager will call SetPasswordHashAsync after CreateAsync.
        domainUser.SetPasswordHash(user.PasswordHash ?? "PENDING");

        _userRepository.Add(domainUser);
        return IdentityResult.Success;
    }

    public async Task<IdentityResult> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        cancellationToken.ThrowIfCancellationRequested();

        if (!Guid.TryParse(user.Id, out var id))
            return IdentityResult.Failed(new IdentityError { Description = "Invalid user id." });

        var domainUser = await _userRepository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        if (domainUser == null)
            return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });

        domainUser.UpdateEmail(user.UserName ?? string.Empty);
        domainUser.UpdateProfile(user.Name ?? string.Empty);
        if (!string.IsNullOrEmpty(user.PasswordHash) && user.PasswordHash != "PENDING")
            domainUser.SetPasswordHash(user.PasswordHash);

        _userRepository.Update(domainUser);
        return IdentityResult.Success;
    }

    public async Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        cancellationToken.ThrowIfCancellationRequested();

        if (!Guid.TryParse(user.Id, out var id))
            return IdentityResult.Failed(new IdentityError { Description = "Invalid user id." });

        var domainUser = await _userRepository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        if (domainUser == null)
            return IdentityResult.Success;

        domainUser.PrepareEntityForDelete(new Account(id));
        _userRepository.Update(domainUser);
        return IdentityResult.Success;
    }

    public async Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var id))
            return null;

        var user = await _userRepository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return user == null ? null : ToApplicationUser(user);
    }

    public async Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(normalizedUserName))
            return null;

        var email = normalizedUserName.Trim();
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken).ConfigureAwait(false);
        return user == null ? null : ToApplicationUser(user);
    }

    public async Task SetPasswordHashAsync(ApplicationUser user, string? passwordHash, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.PasswordHash = passwordHash;
        if (string.IsNullOrEmpty(passwordHash))
            return;

        if (Guid.TryParse(user.Id, out var id))
        {
            var domainUser = await _userRepository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
            if (domainUser != null)
            {
                domainUser.SetPasswordHash(passwordHash);
                _userRepository.Update(domainUser);
            }
        }
    }

    public Task<string?> GetPasswordHashAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.PasswordHash);
    }

    public async Task<bool> HasPasswordAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        var hash = await GetPasswordHashAsync(user, cancellationToken).ConfigureAwait(false);
        return !string.IsNullOrEmpty(hash);
    }

    public Task SetEmailAsync(ApplicationUser user, string? email, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.UserName = email;
        return Task.CompletedTask;
    }

    public Task<string?> GetEmailAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.UserName);
    }

    public Task<bool> GetEmailConfirmedAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(true);
    }

    public Task SetEmailConfirmedAsync(ApplicationUser user, bool confirmed, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public async Task<ApplicationUser?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        return await FindByNameAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);
    }

    public Task<string?> GetNormalizedEmailAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(NormalizeEmail(user.UserName));
    }

    public Task SetNormalizedEmailAsync(ApplicationUser user, string? normalizedEmail, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.UserName = normalizedEmail;
        return Task.CompletedTask;
    }

    private static ApplicationUser ToApplicationUser(User user)
    {
        return new ApplicationUser
        {
            Id = user.Id.ToString(),
            UserName = user.Email,
            PasswordHash = user.PasswordHash,
            Name = user.Name,
            Role = user.Role
        };
    }

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;
        return email.Trim().ToLowerInvariant();
    }
}
