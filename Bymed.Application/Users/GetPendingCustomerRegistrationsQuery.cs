using MediatR;

namespace Bymed.Application.Users;

public sealed record GetPendingCustomerRegistrationsQuery : IRequest<IReadOnlyList<PendingCustomerRegistrationDto>>;
