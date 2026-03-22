using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Payments;

public sealed record ConfirmPaymentForOrderCommand(
    Guid OrderId,
    Guid? CallerUserId,
    string? CallerSessionId) : IRequest<Result<PaymentResult>>;
