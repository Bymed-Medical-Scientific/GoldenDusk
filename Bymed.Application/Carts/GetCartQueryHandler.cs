using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Carts;

public sealed class GetCartQueryHandler : IRequestHandler<GetCartQuery, Result<CartDto>>
{
    private readonly ICartRepository _cartRepository;

    public GetCartQueryHandler(ICartRepository cartRepository)
    {
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
    }

    public async Task<Result<CartDto>> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.SessionId))
            return Result<CartDto>.Failure("Either user id or session id must be provided.");

        if (request.UserId is not null && request.UserId == Guid.Empty)
            return Result<CartDto>.Failure("User id cannot be empty.");

        CartDto? dto = null;

        if (request.UserId is not null)
        {
            var cart = await _cartRepository
                .GetByUserIdAsync(request.UserId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (cart is not null)
                dto = CartMappings.ToDto(cart);
        }
        else if (!string.IsNullOrWhiteSpace(request.SessionId))
        {
            var cart = await _cartRepository
                .GetBySessionIdAsync(request.SessionId, cancellationToken)
                .ConfigureAwait(false);

            if (cart is not null)
                dto = CartMappings.ToDto(cart);
        }

        // An empty cart is represented as null value in the Result.
        return Result<CartDto>.Success(dto!);
    }
}

