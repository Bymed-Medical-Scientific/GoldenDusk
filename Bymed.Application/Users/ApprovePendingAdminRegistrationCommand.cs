using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

/// <summary>Activates a pending admin account created from the admin SPA (requires Admin policy).</summary>
public sealed record ApprovePendingAdminRegistrationCommand(Guid PendingUserId) : IRequest<Result>;
