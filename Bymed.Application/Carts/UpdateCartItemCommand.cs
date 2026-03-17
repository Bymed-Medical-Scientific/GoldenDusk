using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Carts;

public sealed record UpdateCartItemCommand(
    Guid? UserId,
    string? SessionId,
    Guid ProductId,
    int Quantity) : IRequest<Result<CartDto>>;

