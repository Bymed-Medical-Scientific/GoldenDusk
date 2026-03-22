using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Payments;

public sealed class ConfirmPaymentForOrderCommandHandler
    : IRequestHandler<ConfirmPaymentForOrderCommand, Result<PaymentResult>>
{
    private readonly IOrderRepository _orders;
    private readonly IPaymentService _payments;

    public ConfirmPaymentForOrderCommandHandler(IOrderRepository orders, IPaymentService payments)
    {
        _orders = orders ?? throw new ArgumentNullException(nameof(orders));
        _payments = payments ?? throw new ArgumentNullException(nameof(payments));
    }

    public async Task<Result<PaymentResult>> Handle(
        ConfirmPaymentForOrderCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _orders
            .GetByIdAsync(request.OrderId, cancellationToken)
            .ConfigureAwait(false);

        if (order is null)
            return Result<PaymentResult>.Failure("Order not found.");

        var access = OrderPaymentAccess.ValidateCallerCanPay(order, request.CallerUserId, request.CallerSessionId);
        if (access is not null)
            return Result<PaymentResult>.Failure(access);

        var result = await _payments
            .ConfirmPaymentAsync(order.PaymentReference, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaymentResult>.Success(result);
    }
}
