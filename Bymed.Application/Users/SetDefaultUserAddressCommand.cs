using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Users;

public sealed record SetDefaultUserAddressCommand(Guid UserId, Guid AddressId) : IRequest<Result<UserAddressDto>>;
