namespace Bymed.Application.Users;

public sealed class PendingAdminRegistrationDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required bool EmailConfirmed { get; init; }
    public required DateTime CreationTime { get; init; }
}
