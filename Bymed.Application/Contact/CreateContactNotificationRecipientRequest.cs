namespace Bymed.Application.Contact;

public sealed record CreateContactNotificationRecipientRequest
{
    public string Email { get; init; } = string.Empty;
    public bool IsPrimaryRecipient { get; init; }
}
