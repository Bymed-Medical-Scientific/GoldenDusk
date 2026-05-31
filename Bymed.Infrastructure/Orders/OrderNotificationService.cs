using Bymed.Application.Notifications;
using Bymed.Application.Orders;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Enums;

namespace Bymed.Infrastructure.Orders;

public sealed class OrderNotificationService : IOrderNotificationService
{
    private readonly IOrderRepository _orders;
    private readonly IEmailService _emailService;
    private readonly IUnitOfWork _unitOfWork;

    public OrderNotificationService(
        IOrderRepository orders,
        IEmailService emailService,
        IUnitOfWork unitOfWork)
    {
        _orders = orders ?? throw new ArgumentNullException(nameof(orders));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task SendOrderConfirmationIfNotSentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _orders.GetByIdAsync(orderId, cancellationToken).ConfigureAwait(false);
        if (order is null || order.PaymentStatus != PaymentStatus.Completed)
            return;

        if (!order.TryMarkConfirmationEmailSent())
            return;

        await _emailService.SendOrderConfirmationAsync(
            order.CustomerEmail,
            order.CustomerName,
            order.OrderNumber,
            cancellationToken).ConfigureAwait(false);

        _orders.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
