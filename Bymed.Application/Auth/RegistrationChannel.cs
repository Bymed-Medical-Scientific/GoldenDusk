namespace Bymed.Application.Auth;

/// <summary>Where the user initiated registration (drives role and activation rules).</summary>
public enum RegistrationChannel
{
    /// <summary>Next.js storefront: always a customer; account is active immediately.</summary>
    Storefront = 0,

    /// <summary>Angular admin SPA: creates an admin user; inactive until an existing admin approves (except bootstrap).</summary>
    AdminPanel = 1
}
