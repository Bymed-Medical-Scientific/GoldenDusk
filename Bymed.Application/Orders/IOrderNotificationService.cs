namespace Bymed.Application.Orders;

public interface IOrderNotificationService
{
    /// <summary>
    /// Sends the order confirmation email once, after payment is completed.
    /// </summary>
    Task SendOrderConfirmationIfNotSentAsync(Guid orderId, CancellationToken cancellationToken = default);
}
