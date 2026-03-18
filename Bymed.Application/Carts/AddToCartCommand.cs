using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Carts;

public sealed record AddToCartCommand(
    Guid? UserId,
    string? SessionId,
    AddToCartRequest Request) : IRequest<Result<CartDto>>;

