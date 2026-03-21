using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record GetUserProfileQuery(Guid UserId) : IRequest<Result<UserProfileDto>>;
