namespace Bymed.Application.ClientErrors;

/// <summary>Payload from the admin SPA when reporting an unhandled client error.</summary>
public sealed class LogAdminClientErrorRequest
{
    public string Message { get; set; } = string.Empty;

    public string? StackTrace { get; set; }

    public string? PageUrl { get; set; }

    public string? ComponentName { get; set; }
}
