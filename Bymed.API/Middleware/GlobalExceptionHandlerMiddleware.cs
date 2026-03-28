using System.Net;
using System.Text.Json;

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

        _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}, Path: {Path}",
            traceId, context.Request.Path);

        var (statusCode, userMessage) = MapException(exception);
        var response = new ErrorResponse
        {
            Error = userMessage,
            TraceId = traceId,
            Detail = _environment.IsDevelopment() ? exception.ToString() : null
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, JsonOptions)).ConfigureAwait(false);
    }

    private static (HttpStatusCode statusCode, string userMessage) MapException(Exception exception)
    {
        return exception switch
        {
            ArgumentException argEx => (HttpStatusCode.BadRequest, argEx.Message),
            InvalidOperationException opEx => (HttpStatusCode.BadRequest, opEx.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "The requested resource was not found."),
            _ => (HttpStatusCode.InternalServerError,
                "An unexpected error occurred. Please try again later.")
        };
    }
}

internal sealed class ErrorResponse
{
    public string Error { get; init; } = string.Empty;
    public string TraceId { get; init; } = string.Empty;
    public string? Detail { get; init; }
}
