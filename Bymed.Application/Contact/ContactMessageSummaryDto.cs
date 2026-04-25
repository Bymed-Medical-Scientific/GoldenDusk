namespace Bymed.Application.Contact;

public sealed class ContactMessageSummaryDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required string Subject { get; init; }
    public required string Message { get; init; }
    public required DateTime SubmittedAtUtc { get; init; }
}
