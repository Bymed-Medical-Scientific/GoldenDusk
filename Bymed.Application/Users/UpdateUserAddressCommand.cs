using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record UpdateUserAddressCommand(Guid UserId, Guid AddressId, UpsertAddressRequest Request) : IRequest<Result<UserAddressDto>>;
