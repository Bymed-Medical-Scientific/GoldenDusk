using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Payments;

public sealed record InitiatePaymentForOrderCommand(
    Guid OrderId,
    Guid? CallerUserId,
    string? CallerSessionId) : IRequest<Result<PaymentInitiationResult>>;
