using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Persistence;

internal static class DbUpdateExceptionHelper
{
    public static bool IsOrderIdempotencyKeyConflict(DbUpdateException exception)
    {
        var message = exception.InnerException?.Message ?? exception.Message;
        if (string.IsNullOrWhiteSpace(message))
            return false;

        return message.Contains("IdempotencyKey", StringComparison.OrdinalIgnoreCase)
            || message.Contains("IX_Orders_IdempotencyKey", StringComparison.OrdinalIgnoreCase);
    }
}
