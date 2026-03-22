using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Payments;

public sealed class InitiatePaymentForOrderCommandHandler
    : IRequestHandler<InitiatePaymentForOrderCommand, Result<PaymentInitiationResult>>
{
    private readonly IOrderRepository _orders;
    private readonly IPaymentService _payments;

    public InitiatePaymentForOrderCommandHandler(IOrderRepository orders, IPaymentService payments)
    {
        _orders = orders ?? throw new ArgumentNullException(nameof(orders));
        _payments = payments ?? throw new ArgumentNullException(nameof(payments));
    }

    public async Task<Result<PaymentInitiationResult>> Handle(
        InitiatePaymentForOrderCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _orders
            .GetByIdAsync(request.OrderId, cancellationToken)
            .ConfigureAwait(false);

        if (order is null)
            return Result<PaymentInitiationResult>.Failure("Order not found.");

        var access = OrderPaymentAccess.ValidateCallerCanPay(order, request.CallerUserId, request.CallerSessionId);
        if (access is not null)
            return Result<PaymentInitiationResult>.Failure(access);

        var ready = OrderPaymentAccess.ValidateOrderReadyForPayment(order);
        if (ready is not null)
            return Result<PaymentInitiationResult>.Failure(ready);

        var result = await _payments
            .InitiatePaymentAsync(order.Total, order.Currency, order.PaymentReference, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaymentInitiationResult>.Success(result);
    }
}
