using Bymed.Application.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Bymed.Application.ClientErrors;

public sealed class LogAdminClientErrorCommandHandler : IRequestHandler<LogAdminClientErrorCommand, Result>
{
    private readonly ILogger<LogAdminClientErrorCommandHandler> _logger;

    public LogAdminClientErrorCommandHandler(ILogger<LogAdminClientErrorCommandHandler> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task<Result> Handle(LogAdminClientErrorCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request;
        var message = payload.Message.Trim();

        _logger.LogWarning(
            "Admin client error. Message: {ClientMessage}, PageUrl: {PageUrl}, Component: {ComponentName}, StackTrace: {StackTrace}",
            message,
            payload.PageUrl,
            payload.ComponentName,
            payload.StackTrace);

        return Task.FromResult(Result.Success());
    }
}
