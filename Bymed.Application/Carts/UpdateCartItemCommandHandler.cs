using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Carts;

public sealed class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, Result<CartDto>>
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCartItemCommandHandler(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<CartDto>> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.SessionId))
            return Result<CartDto>.Failure("Either user id or session id must be provided.");

        if (request.UserId is not null && request.UserId == Guid.Empty)
            return Result<CartDto>.Failure("User id cannot be empty.");

        if (request.Quantity <= 0)
            return Result<CartDto>.Failure("Quantity must be greater than zero.");

        var product = await _productRepository
            .GetByIdAsync(request.ProductId, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<CartDto>.Failure("Product not found.");

        var cart = request.UserId is not null
            ? await _cartRepository.GetByUserIdAsync(request.UserId.Value, cancellationToken).ConfigureAwait(false)
            : await _cartRepository.GetBySessionIdAsync(request.SessionId!, cancellationToken).ConfigureAwait(false);

        if (cart is null)
            return Result<CartDto>.Failure("Cart not found.");

        cart.AddOrUpdateItem(product.Id, request.Quantity, product.Price);

        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<CartDto>.Success(CartMappings.ToDto(cart));
    }
}

