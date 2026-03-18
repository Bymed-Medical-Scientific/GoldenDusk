using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Carts;

public sealed record RemoveCartItemCommand(
    Guid? UserId,
    string? SessionId,
    Guid ProductId) : IRequest<Result<CartDto>>;

