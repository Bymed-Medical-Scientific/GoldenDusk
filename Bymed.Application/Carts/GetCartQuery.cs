using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Carts;

public sealed record GetCartQuery(
    Guid? UserId,
    string? SessionId) : IRequest<Result<CartDto>>;

