using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// User (customer or admin). Authentication is handled by Infrastructure (ASP.NET Identity); PasswordHash is stored here.
/// </summary>
public class User : FullAuditedEntity
{
    public const int EmailMaxLength = 256;
    public const int NameMaxLength = 200;

    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }

    private User()
    {
    }

    /// <summary>
    /// Creates a new user. Call SetPasswordHash with the hashed password (from Identity) and PrepareEntityForCreate(account) when persisting.
    /// </summary>
    public User(string email, string name, UserRole role) : base()
    {
        SetEmail(email);
        SetName(name);
        Role = role;
    }

    /// <summary>
    /// Creates a new user with a specific Id (e.g. for Identity store so ApplicationUser.Id matches). Call SetPasswordHash and PrepareEntityForCreate when persisting.
    /// </summary>
    public User(Guid id, string email, string name, UserRole role) : base(id)
    {
        SetEmail(email);
        SetName(name);
        Role = role;
    }

    /// <summary>
    /// Sets the password hash. Must be called by application layer after hashing (e.g. ASP.NET Identity). Never pass plaintext.
    /// </summary>
    public void SetPasswordHash(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    /// <summary>
    /// Updates profile. Call PrepareEntityForUpdate(account) when persisting.
    /// </summary>
    public void UpdateProfile(string name)
    {
        SetName(name);
    }

    /// <summary>
    /// Updates email (e.g. after verification). Call PrepareEntityForUpdate(account) when persisting.
    /// </summary>
    public void UpdateEmail(string email)
    {
        SetEmail(email);
    }

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
