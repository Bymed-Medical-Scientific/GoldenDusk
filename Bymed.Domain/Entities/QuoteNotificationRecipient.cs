using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class QuoteNotificationRecipient : BaseEntity
{
    public const int EmailMaxLength = 254;

    public string Email { get; private set; } = string.Empty;
    public bool IsPrimaryRecipient { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private QuoteNotificationRecipient() { }

    public QuoteNotificationRecipient(string email, bool isPrimaryRecipient, DateTime createdAtUtc)
    {
        SetEmail(email);
        IsPrimaryRecipient = isPrimaryRecipient;
        CreatedAtUtc = createdAtUtc;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;

    private void SetEmail(string email)
    {
        ArgumentNullException.ThrowIfNull(email);
        var trimmed = email.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Email is required.", nameof(email));
        if (trimmed.Length > EmailMaxLength)
            throw new ArgumentException($"Email must not exceed {EmailMaxLength} characters.", nameof(email));
        Email = trimmed;
    }
}
