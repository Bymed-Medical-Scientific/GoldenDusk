using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record SetCustomerPriceVisibilityCommand(Guid UserId, bool CanViewPrices) : IRequest<Result>;
