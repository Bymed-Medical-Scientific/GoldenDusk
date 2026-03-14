using System.Security.Claims;
using Bymed.API.Authorization;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 34: Admin Access Control.
/// Only principals with the Admin role satisfy the Admin policy; Customer and unauthenticated principals must not.
/// Validates: Requirements 12.4 (role-based authorization).
/// </summary>
public class AdminAccessControlPropertyTests
{
    private static IAuthorizationService CreateAuthorizationService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(options => options.AddBymedRolePolicies());
        return services.BuildServiceProvider().GetRequiredService<IAuthorizationService>();
    }

    private static ClaimsPrincipal CreatePrincipal(string? role, bool authenticated = true)
    {
        var identity = new ClaimsIdentity(
            authenticated ? "Test" : null,
            ClaimTypes.Name,
            ClaimTypes.Role);

        if (authenticated)
        {
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));
            identity.AddClaim(new Claim(ClaimTypes.Name, "Test User"));
        }

        if (!string.IsNullOrEmpty(role))
            identity.AddClaim(new Claim(ClaimTypes.Role, role));

        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Principal with Admin role must be authorized by the Admin policy.
    /// Feature: bymed-website, Property 34: Admin Access Control
    /// </summary>
    [Fact]
    public async Task AdminRole_AuthorizedByAdminPolicy()
    {
        var authService = CreateAuthorizationService();
        var principal = CreatePrincipal("Admin");

        var result = await authService.AuthorizeAsync(principal, resource: null, policyName: AuthorizationPolicies.Admin);

        result.Succeeded.Should().BeTrue("Admin role must satisfy the Admin policy");
    }

    /// <summary>
    /// Principal with Customer role must not be authorized by the Admin policy.
    /// Feature: bymed-website, Property 34: Admin Access Control
    /// </summary>
    [Fact]
    public async Task CustomerRole_NotAuthorizedByAdminPolicy()
    {
        var authService = CreateAuthorizationService();
        var principal = CreatePrincipal("Customer");

        var result = await authService.AuthorizeAsync(principal, resource: null, policyName: AuthorizationPolicies.Admin);

        result.Succeeded.Should().BeFalse("Customer role must not satisfy the Admin policy");
        result.Failure.Should().NotBeNull();
    }

    /// <summary>
    /// Unauthenticated principal must not be authorized by the Admin policy.
    /// Feature: bymed-website, Property 34: Admin Access Control
    /// </summary>
    [Fact]
    public async Task Unauthenticated_NotAuthorizedByAdminPolicy()
    {
        var authService = CreateAuthorizationService();
        var principal = CreatePrincipal(role: null, authenticated: false);

        var result = await authService.AuthorizeAsync(principal, resource: null, policyName: AuthorizationPolicies.Admin);

        result.Succeeded.Should().BeFalse("Unauthenticated principal must not satisfy the Admin policy");
    }

    /// <summary>
    /// Principal with no role (authenticated but no role claim) must not be authorized by the Admin policy.
    /// Feature: bymed-website, Property 34: Admin Access Control
    /// </summary>
    [Fact]
    public async Task AuthenticatedWithNoRole_NotAuthorizedByAdminPolicy()
    {
        var authService = CreateAuthorizationService();
        var principal = CreatePrincipal(role: null, authenticated: true);

        var result = await authService.AuthorizeAsync(principal, resource: null, policyName: AuthorizationPolicies.Admin);

        result.Succeeded.Should().BeFalse("Principal without Admin role must not satisfy the Admin policy");
    }

    /// <summary>
    /// Customer role must be authorized by the Customer policy (sanity check for role-based auth).
    /// Feature: bymed-website, Property 34: Admin Access Control
    /// </summary>
    [Fact]
    public async Task CustomerRole_AuthorizedByCustomerPolicy()
    {
        var authService = CreateAuthorizationService();
        var principal = CreatePrincipal("Customer");

        var result = await authService.AuthorizeAsync(principal, resource: null, policyName: AuthorizationPolicies.Customer);

        result.Succeeded.Should().BeTrue("Customer role must satisfy the Customer policy");
    }
}
