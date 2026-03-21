using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record UpdateUserProfileCommand(Guid UserId, UpdateProfileRequest Request) : IRequest<Result<UserProfileDto>>;
