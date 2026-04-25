using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class ContactNotificationRecipient : BaseEntity
{
    public const int EmailMaxLength = 254;

    public string Email { get; private set; } = string.Empty;
    public bool IsPrimaryRecipient { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private ContactNotificationRecipient()
    {
    }

    public ContactNotificationRecipient(string email, bool isPrimaryRecipient)
    {
        SetEmail(email);
        IsPrimaryRecipient = isPrimaryRecipient;
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }

    private void SetEmail(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Email is required.", nameof(value));
        if (trimmed.Length > EmailMaxLength)
            throw new ArgumentException($"Email must not exceed {EmailMaxLength} characters.", nameof(value));
        Email = trimmed;
    }
}
