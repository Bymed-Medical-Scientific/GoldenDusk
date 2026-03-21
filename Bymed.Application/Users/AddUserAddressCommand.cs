using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record AddUserAddressCommand(Guid UserId, UpsertAddressRequest Request) : IRequest<Result<UserAddressDto>>;
