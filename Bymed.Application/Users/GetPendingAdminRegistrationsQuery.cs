using MediatR;

namespace Bymed.Application.Users;

public sealed record GetPendingAdminRegistrationsQuery : IRequest<IReadOnlyList<PendingAdminRegistrationDto>>;
