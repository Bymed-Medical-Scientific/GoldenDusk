using Microsoft.AspNetCore.Authorization;

namespace Bymed.API.Authorization;

/// <summary>
/// Role-based authorization policy names. Use with [Authorize(Policy = AuthorizationPolicies.Admin)] on admin endpoints.
/// </summary>
public static class AuthorizationPolicies
{
    /// <summary>Policy requiring the Admin role.</summary>
    public const string Admin = "Admin";

    /// <summary>Policy requiring the Customer role.</summary>
    public const string Customer = "Customer";

    /// <summary>
    /// Adds Bymed role-based policies (Admin, Customer) to the given options. Used by the API and by tests.
    /// </summary>
    public static AuthorizationOptions AddBymedRolePolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(Admin, policy => policy.RequireRole("Admin"));
        options.AddPolicy(Customer, policy => policy.RequireRole("Customer"));
        return options;
    }
}
