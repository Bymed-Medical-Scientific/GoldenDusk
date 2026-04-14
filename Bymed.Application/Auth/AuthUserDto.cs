using Bymed.Domain.Enums;

namespace Bymed.Application.Auth;

public sealed record AuthUserDto
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required UserRole Role { get; init; }
    public required bool IsActive { get; init; }
}
