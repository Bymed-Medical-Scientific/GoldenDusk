using System.IO;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Bymed.API.Middleware;

/// <summary>
/// Global exception handler middleware. Catches unhandled exceptions, logs them via Serilog,
/// and returns standardized error responses.
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            // Client disconnected, upstream fetch aborted, or host shutdown — not an application bug.
            if (context.RequestAborted.IsCancellationRequested)
            {
                _logger.LogDebug(
                    "Request canceled (likely client disconnect or aborted caller). Path: {Path}, TraceId: {TraceId}",
                    context.Request.Path,
                    context.TraceIdentifier);
            }

            throw;
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex).ConfigureAwait(false);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;

        if (exception is DbUpdateConcurrencyException concurrencyEx)
        {
            foreach (var entry in concurrencyEx.Entries)
            {
                _logger.LogWarning(
                    "Concurrency conflict on entity {EntityType} (state: {State}). TraceId: {TraceId}, Path: {Path}",
                    entry.Metadata.ClrType.Name,
                    entry.State,
                    traceId,
                    context.Request.Path);
            }
        }

        _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}, Path: {Path}",
            traceId, context.Request.Path);

        var (statusCode, userMessage) = MapException(exception, context.Request.Path.Value ?? string.Empty);
        string[]? concurrencyEntityTypes = null;
        if (exception is DbUpdateConcurrencyException cex)
        {
            concurrencyEntityTypes = cex.Entries
                .Select(e => e.Metadata.ClrType.FullName ?? e.Metadata.ClrType.Name)
                .Distinct(StringComparer.Ordinal)
                .ToArray();
        }

        var response = new ErrorResponse
        {
            Error = userMessage,
            TraceId = traceId,
            ExceptionType = exception.GetType().FullName,
            Detail = _environment.IsDevelopment() ? exception.ToString() : null,
            ConcurrencyEntityTypes = concurrencyEntityTypes
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, JsonOptions)).ConfigureAwait(false);
    }

    private static (HttpStatusCode statusCode, string userMessage) MapException(Exception exception, string requestPath)
    {
        return exception switch
        {
            ArgumentException argEx => (HttpStatusCode.BadRequest, argEx.Message),
            InvalidOperationException opEx => (HttpStatusCode.BadRequest, opEx.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "The requested resource was not found."),
            InvalidDataException idEx => (HttpStatusCode.BadRequest, idEx.Message),
            DbUpdateConcurrencyException => (
                HttpStatusCode.Conflict,
                requestPath.Contains("marketing-campaigns", StringComparison.OrdinalIgnoreCase)
                    ? "This campaign was changed while your request was in progress (for example another tab started sending or saved changes). Refresh the page and try again."
                    : "This record was updated by another request. Refresh the page and try again."),
            DbUpdateException dbEx => (
                HttpStatusCode.BadRequest,
                BuildDbUpdateUserMessage(dbEx)),
            IOException ioEx => (
                HttpStatusCode.ServiceUnavailable,
                "File storage or network I/O failed. Please try again or contact support if it persists."),
            _ => (HttpStatusCode.InternalServerError,
                "An unexpected error occurred. Please try again later.")
        };
    }

    private static string BuildDbUpdateUserMessage(DbUpdateException dbEx)
    {
        var inner = dbEx.InnerException?.Message;
        if (!string.IsNullOrWhiteSpace(inner) && inner.Contains("23505", StringComparison.Ordinal))
            return "This record conflicts with existing data (duplicate).";

        return "Could not save changes to the database.";
    }
}

internal sealed class ErrorResponse
{
    public string Error { get; init; } = string.Empty;
    public string TraceId { get; init; } = string.Empty;

    /// <summary>CLR exception type (for support; not a security boundary).</summary>
    public string? ExceptionType { get; init; }

    public string? Detail { get; init; }

    /// <summary>When <see cref="ExceptionType"/> is a concurrency conflict, EF entity CLR type names (diagnostics).</summary>
    public string[]? ConcurrencyEntityTypes { get; init; }
}
