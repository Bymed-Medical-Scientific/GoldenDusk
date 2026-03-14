using Bymed.Domain.Enums;

namespace Bymed.Infrastructure.Identity;

/// <summary>
/// Adapter type for ASP.NET Core Identity that maps to the domain User entity.
/// Used by UserManager and custom UserStore; Id and UserName (email) are the primary identifiers.
/// </summary>
public sealed class ApplicationUser
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? PasswordHash { get; set; }
    public string? Name { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
}
