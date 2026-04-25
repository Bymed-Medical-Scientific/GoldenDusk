namespace Bymed.Application.Contact;

public sealed class ContactNotificationRecipientDto
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required bool IsPrimaryRecipient { get; init; }
    public required bool IsActive { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
}
