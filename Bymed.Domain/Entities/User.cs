using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class User : FullAuditedEntity
{
    public const int EmailMaxLength = 256;
    public const int NameMaxLength = 200;

    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool EmailConfirmed { get; private set; }
    /// <summary>When false, the account cannot sign in (e.g. admin registration pending approval).</summary>
    public bool IsActive { get; private set; } = true;
    public int AccessFailedCount { get; private set; }
    public DateTimeOffset? LockoutEnd { get; private set; }
    public bool LockoutEnabled { get; private set; } = true;
    public ICollection<Address> Addresses { get; private set; } = new List<Address>();

    private User()
    {
    }

    public User(string email, string name, UserRole role, bool isActive = true, bool emailConfirmed = false) : base()
    {
        SetEmail(email);
        SetName(name);
        Role = role;
        IsActive = isActive;
        EmailConfirmed = emailConfirmed;
    }

    public User(Guid id, string email, string name, UserRole role, bool isActive = true, bool emailConfirmed = false) : base(id)
    {
        SetEmail(email);
        SetName(name);
        Role = role;
        IsActive = isActive;
        EmailConfirmed = emailConfirmed;
    }

    public void SetActive(bool active) => IsActive = active;
    public void SetEmailConfirmed(bool confirmed) => EmailConfirmed = confirmed;

    public void SetPasswordHash(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    public void UpdateProfile(string name)
    {
        SetName(name);
    }

    public void UpdateEmail(string email)
    {
        SetEmail(email);
    }

    public void ResetAccessFailedCount() => AccessFailedCount = 0;

    public void IncrementAccessFailedCount() => AccessFailedCount++;

    public void SetLockoutEnd(DateTimeOffset? lockoutEnd) => LockoutEnd = lockoutEnd;

    public void SetLockoutEnabled(bool enabled) => LockoutEnabled = enabled;

    /// <summary>Updates lockout fields as persisted by ASP.NET Identity lockout store.</summary>
    public void SetLockoutState(int accessFailedCount, DateTimeOffset? lockoutEnd, bool lockoutEnabled)
    {
        if (accessFailedCount < 0)
            throw new ArgumentOutOfRangeException(nameof(accessFailedCount));
        AccessFailedCount = accessFailedCount;
        LockoutEnd = lockoutEnd;
        LockoutEnabled = lockoutEnabled;
    }

    public bool IsLockedOut(DateTimeOffset utcNow) =>
        LockoutEnabled && LockoutEnd.HasValue && LockoutEnd.Value > utcNow;

    private void SetEmail(string email)
    {
        ArgumentNullException.ThrowIfNull(email);
        var trimmed = email.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Email is required.", nameof(email));
        if (trimmed.Length > EmailMaxLength)
            throw new ArgumentException($"Email must not exceed {EmailMaxLength} characters.", nameof(email));
        Email = trimmed;
    }

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Name must not exceed {NameMaxLength} characters.", nameof(name));
        Name = trimmed;
    }
}
