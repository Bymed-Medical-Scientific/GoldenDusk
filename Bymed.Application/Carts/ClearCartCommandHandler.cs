using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Carts;

public sealed class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, Result>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ClearCartCommandHandler(
        ICartRepository cartRepository,
        IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.SessionId))
            return Result.Failure("Either user id or session id must be provided.");

        if (request.UserId is not null && request.UserId == Guid.Empty)
            return Result.Failure("User id cannot be empty.");

        var cart = request.UserId is not null
            ? await _cartRepository.GetByUserIdAsync(request.UserId.Value, cancellationToken).ConfigureAwait(false)
            : await _cartRepository.GetBySessionIdAsync(request.SessionId!, cancellationToken).ConfigureAwait(false);

        if (cart is null)
            return Result.Success();

        _cartRepository.Remove(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}

