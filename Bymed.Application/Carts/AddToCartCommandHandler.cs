using Bymed.Application.Carts;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Carts;

public sealed class AddToCartCommandHandler : IRequestHandler<AddToCartCommand, Result<CartDto>>
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddToCartCommandHandler(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<CartDto>> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.SessionId))
            return Result<CartDto>.Failure("Either user id or session id must be provided.");

        if (request.UserId is not null && request.UserId == Guid.Empty)
            return Result<CartDto>.Failure("User id cannot be empty.");

        if (request.Request.Quantity <= 0)
            return Result<CartDto>.Failure("Quantity must be greater than zero.");

        var product = await _productRepository
            .GetByIdAsync(request.Request.ProductId, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<CartDto>.Failure("Product not found.");

        if (!product.IsAvailable)
            return Result<CartDto>.Failure("Product is not available.");

        Cart? cart = null;
        var isNewCart = false;

        if (request.UserId is not null)
        {
            cart = await _cartRepository
                .GetByUserIdAsync(request.UserId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (cart is null)
            {
                cart = Cart.ForUser(request.UserId.Value);
                isNewCart = true;
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.SessionId))
        {
            cart = await _cartRepository
                .GetBySessionIdAsync(request.SessionId, cancellationToken)
                .ConfigureAwait(false);

            if (cart is null)
            {
                cart = Cart.ForGuest(request.SessionId!);
                isNewCart = true;
            }
        }

        if (cart is null)
            return Result<CartDto>.Failure("Failed to resolve cart.");

        cart.AddOrUpdateItem(product.Id, request.Request.Quantity, product.Price);

        if (isNewCart)
            _cartRepository.Add(cart);
        else
            _cartRepository.Update(cart);

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<CartDto>.Success(CartMappings.ToDto(cart));
    }
}

