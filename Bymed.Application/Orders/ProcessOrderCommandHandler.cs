using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class ProcessOrderCommandHandler : IRequestHandler<ProcessOrderCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IProductImageRepository _productImageRepository;
    private readonly IOrderNumberGenerator _orderNumberGenerator;
    private readonly IUnitOfWork _unitOfWork;

    public ProcessOrderCommandHandler(
        IOrderRepository orderRepository,
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IProductImageRepository productImageRepository,
        IOrderNumberGenerator orderNumberGenerator,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
        _orderNumberGenerator = orderNumberGenerator ?? throw new ArgumentNullException(nameof(orderNumberGenerator));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<OrderDto>> Handle(ProcessOrderCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        if (string.IsNullOrWhiteSpace(req.IdempotencyKey))
            return Result<OrderDto>.Failure("Idempotency key is required.");

        var idempotencyKey = req.IdempotencyKey.Trim();

        if (req.UserId is null && string.IsNullOrWhiteSpace(req.SessionId))
            return Result<OrderDto>.Failure("Either user id or session id must be provided.");

        Cart? cart = null;
        if (req.UserId.HasValue && req.UserId.Value != Guid.Empty)
            cart = await _cartRepository.GetByUserIdAsync(req.UserId.Value, cancellationToken).ConfigureAwait(false);
        else if (!string.IsNullOrWhiteSpace(req.SessionId))
            cart = await _cartRepository.GetBySessionIdAsync(req.SessionId.Trim(), cancellationToken).ConfigureAwait(false);

        if (cart is null || cart.Items.Count == 0)
            return Result<OrderDto>.Failure("Cart is empty or not found.");

        var existing = await _orderRepository.GetByIdempotencyKeyAsync(idempotencyKey, cancellationToken).ConfigureAwait(false);
        if (existing is not null)
        {
            if (!OrderCartMatcher.Matches(existing, cart))
            {
                return Result<OrderDto>.Failure(
                    "Your cart changed since the last checkout attempt. Refresh checkout and try again.");
            }

            return Result<OrderDto>.Success(OrderMappings.ToDto(existing));
        }

        var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _productRepository.GetByIdsAsync(productIds, cancellationToken).ConfigureAwait(false);
        var productMap = products.ToDictionary(p => p.Id);
        var imageUrls = await _productImageRepository.GetPrimaryImageUrlsByProductIdsAsync(productIds, cancellationToken).ConfigureAwait(false);

        var shippingAddress = OrderMappings.ToDomain(req.ShippingAddress);
        var orderNumber = await _orderNumberGenerator
            .GenerateAsync(req.CustomerName.Trim(), cancellationToken)
            .ConfigureAwait(false);
        var paymentReference = idempotencyKey;

        var sessionIdForOrder = string.IsNullOrWhiteSpace(req.SessionId) ? null : req.SessionId.Trim();

        var order = new Order(
            orderNumber,
            idempotencyKey,
            req.UserId,
            sessionIdForOrder,
            req.CustomerEmail.Trim(),
            req.CustomerName.Trim(),
            shippingAddress,
            Product.DefaultCurrency,
            1m,
            paymentReference,
            req.PaymentMethod.Trim(),
            PaymentStatus.Pending);

        foreach (var item in cart.Items)
        {
            if (!productMap.TryGetValue(item.ProductId, out var product))
                return Result<OrderDto>.Failure($"Product {item.ProductId} not found.");

            if (product.Price <= 0)
                return Result<OrderDto>.Failure($"{product.Name} is not available for online purchase.");

            var imageUrl = imageUrls.TryGetValue(item.ProductId, out var url) ? url : string.Empty;
            order.AddItem(item.ProductId, product.Name, imageUrl, item.Quantity, product.Price);
        }

        order.SetTaxAndShipping(req.Tax, req.ShippingCost);
        order.RecalculateTotals();

        if (!string.IsNullOrWhiteSpace(req.Notes))
            order.SetNotes(req.Notes);

        _orderRepository.Add(order);
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (IdempotencyConflictException)
        {
            _unitOfWork.ClearTrackedChanges();
            var raced = await _orderRepository
                .GetByIdempotencyKeyAsync(idempotencyKey, cancellationToken)
                .ConfigureAwait(false);
            if (raced is null)
                return Result<OrderDto>.Failure("Could not complete checkout. Please retry.");

            return Result<OrderDto>.Success(OrderMappings.ToDto(raced));
        }

        return Result<OrderDto>.Success(OrderMappings.ToDto(order));
    }
}
