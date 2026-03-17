using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Carts;

public sealed record ClearCartCommand(
    Guid? UserId,
    string? SessionId) : IRequest<Result>;

