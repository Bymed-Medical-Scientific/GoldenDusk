using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class ContactMessage : BaseEntity
{
    public const int NameMaxLength = 100;
    public const int EmailMaxLength = 254;
    public const int SubjectMaxLength = 200;
    public const int MessageMaxLength = 5000;

    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public DateTime SubmittedAtUtc { get; private set; }

    private ContactMessage()
    {
    }

    public ContactMessage(string name, string email, string subject, string message, DateTime submittedAtUtc)
    {
        SetName(name);
        SetEmail(email);
        SetSubject(subject);
        SetMessage(message);
        SubmittedAtUtc = submittedAtUtc;
    }

    private void SetName(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Name is required.", nameof(value));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Name must not exceed {NameMaxLength} characters.", nameof(value));
        Name = trimmed;
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

    private void SetSubject(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Subject is required.", nameof(value));
        if (trimmed.Length > SubjectMaxLength)
            throw new ArgumentException($"Subject must not exceed {SubjectMaxLength} characters.", nameof(value));
        Subject = trimmed;
    }

    private void SetMessage(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Message is required.", nameof(value));
        if (trimmed.Length > MessageMaxLength)
            throw new ArgumentException($"Message must not exceed {MessageMaxLength} characters.", nameof(value));
        Message = trimmed;
    }
}
