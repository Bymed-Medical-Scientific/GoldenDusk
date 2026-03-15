using Microsoft.AspNetCore.Authorization;

namespace Bymed.API.Authorization;

public static class AuthorizationPolicies
{
    public const string Admin = "Admin";

    public const string Customer = "Customer";

    public static AuthorizationOptions AddBymedRolePolicies(this AuthorizationOptions options)
    {
        options.AddPolicy(Admin, policy => policy.RequireRole("Admin"));
        options.AddPolicy(Customer, policy => policy.RequireRole("Customer"));
        return options;
    }
}
