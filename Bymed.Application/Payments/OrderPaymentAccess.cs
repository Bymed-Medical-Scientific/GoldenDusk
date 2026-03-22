using Bymed.Domain.Entities;
using Bymed.Domain.Enums;

namespace Bymed.Application.Payments;

/// <summary>
/// Validates that the caller may initiate or confirm payment for an order (JWT user or guest session).
/// </summary>
internal static class OrderPaymentAccess
{
    public static string? ValidateCallerCanPay(Order order, Guid? callerUserId, string? callerSessionId)
    {
        ArgumentNullException.ThrowIfNull(order);

        if (order.UserId.HasValue && order.UserId.Value != Guid.Empty)
        {
            if (!callerUserId.HasValue || callerUserId.Value != order.UserId.Value)
                return "You are not allowed to pay for this order.";
            return null;
        }

        if (string.IsNullOrWhiteSpace(order.SessionId))
            return "This order cannot be paid online (missing session).";

        var session = callerSessionId?.Trim();
        if (string.IsNullOrEmpty(session) || !string.Equals(order.SessionId, session, StringComparison.Ordinal))
            return "You are not allowed to pay for this order.";

        return null;
    }

    public static string? ValidateOrderReadyForPayment(Order order)
    {
        ArgumentNullException.ThrowIfNull(order);

        if (order.Items.Count == 0)
            return "Order has no line items.";

        if (order.Total <= 0)
            return "Order total must be greater than zero.";

        if (order.PaymentStatus != PaymentStatus.Pending)
            return "Order is not awaiting payment.";

        return null;
    }
}
