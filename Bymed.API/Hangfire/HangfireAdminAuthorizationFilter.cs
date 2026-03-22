using Hangfire.Dashboard;

namespace Bymed.API.Hangfire;

/// <summary>
/// Restricts Hangfire dashboard to authenticated users in the Admin role.
/// </summary>
public sealed class HangfireAdminAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var http = context.GetHttpContext();
        return http.User.Identity?.IsAuthenticated == true && http.User.IsInRole("Admin");
    }
}
