using Bymed.Domain.Enums;

namespace Bymed.Infrastructure.Identity;

public sealed class ApplicationUser
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? PasswordHash { get; set; }
    public string? Name { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool EmailConfirmed { get; set; }
    public bool IsActive { get; set; } = true;
    public bool CanViewPrices { get; set; }
    public int AccessFailedCount { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool LockoutEnabled { get; set; } = true;
}
