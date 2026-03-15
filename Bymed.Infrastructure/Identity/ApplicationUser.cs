using Bymed.Domain.Enums;

namespace Bymed.Infrastructure.Identity;

public sealed class ApplicationUser
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? PasswordHash { get; set; }
    public string? Name { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
}
