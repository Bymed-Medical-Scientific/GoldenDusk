using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record DeclineCustomerRegistrationCommand(Guid UserId) : IRequest<Result>;
