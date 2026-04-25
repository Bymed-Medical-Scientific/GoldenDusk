using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record ApproveCustomerRegistrationCommand(Guid UserId, bool CanViewPrices = true) : IRequest<Result>;
