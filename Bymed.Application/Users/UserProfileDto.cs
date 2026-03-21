namespace Bymed.Application.Users;

public sealed record UserProfileDto
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required IReadOnlyList<UserAddressDto> Addresses { get; init; }
}
