using Bymed.Application.Common;
using Bymed.Application.Notifications;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Domain.ValueObjects;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class ProcessOrderCommandHandler : IRequestHandler<ProcessOrderCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IProductImageRepository _productImageRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    public ProcessOrderCommandHandler(
        IOrderRepository orderRepository,
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IProductImageRepository productImageRepository,
        IUnitOfWork unitOfWork,
        IEmailService emailService)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _cartRepository = cartRepository ?? throw new ArgumentNullException(nameof(cartRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _productImageRepository = productImageRepository ?? throw new ArgumentNullException(nameof(productImageRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public async Task<Result<OrderDto>> Handle(ProcessOrderCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        if (string.IsNullOrWhiteSpace(req.IdempotencyKey))
            return Result<OrderDto>.Failure("Idempotency key is required.");

        var idempotencyKey = req.IdempotencyKey.Trim();

        var existing = await _orderRepository.GetByIdempotencyKeyAsync(idempotencyKey, cancellationToken).ConfigureAwait(false);
        if (existing is not null)
            return Result<OrderDto>.Success(OrderMappings.ToDto(existing));

        if (req.UserId is null && string.IsNullOrWhiteSpace(req.SessionId))
            return Result<OrderDto>.Failure("Either user id or session id must be provided.");

        Cart? cart = null;
        if (req.UserId.HasValue && req.UserId.Value != Guid.Empty)
            cart = await _cartRepository.GetByUserIdAsync(req.UserId.Value, cancellationToken).ConfigureAwait(false);
        else if (!string.IsNullOrWhiteSpace(req.SessionId))
            cart = await _cartRepository.GetBySessionIdAsync(req.SessionId.Trim(), cancellationToken).ConfigureAwait(false);

        if (cart is null || cart.Items.Count == 0)
            return Result<OrderDto>.Failure("Cart is empty or not found.");

        var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _productRepository.GetByIdsAsync(productIds, cancellationToken).ConfigureAwait(false);
        var productMap = products.ToDictionary(p => p.Id);
        var imageUrls = await _productImageRepository.GetPrimaryImageUrlsByProductIdsAsync(productIds, cancellationToken).ConfigureAwait(false);

        var shippingAddress = OrderMappings.ToDomain(req.ShippingAddress);
        var orderNumber = GenerateOrderNumber();
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

            var imageUrl = imageUrls.TryGetValue(item.ProductId, out var url) ? url : string.Empty;
            order.AddItem(item.ProductId, product.Name, imageUrl, item.Quantity, item.PriceAtAdd);
        }

        order.SetTaxAndShipping(req.Tax, req.ShippingCost);
        order.RecalculateTotals();

        _orderRepository.Add(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _emailService.SendOrderConfirmationAsync(
            order.CustomerEmail,
            order.CustomerName,
            order.OrderNumber,
            cancellationToken).ConfigureAwait(false);

        return Result<OrderDto>.Success(OrderMappings.ToDto(order));
    }

    private static string GenerateOrderNumber()
    {
        return $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..Math.Min(Order.OrderNumberMaxLength, 50)];
    }
}
