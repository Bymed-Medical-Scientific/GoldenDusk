using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateOrderStatusCommandHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        IInventoryLogRepository inventoryLogRepository,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _inventoryLogRepository = inventoryLogRepository ?? throw new ArgumentNullException(nameof(inventoryLogRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<OrderDto>> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(request.OrderId, cancellationToken).ConfigureAwait(false);
        if (order is null)
            return Result<OrderDto>.Failure("Order not found.");

        if (!IsValidTransition(order.Status, request.Request.Status))
            return Result<OrderDto>.Failure($"Invalid status transition from {order.Status} to {request.Request.Status}.");

        if (request.Request.Status == OrderStatus.Delivered)
        {
            var validation = await DecrementInventoryForCompletedOrder(order, cancellationToken).ConfigureAwait(false);
            if (!validation.IsSuccess)
                return Result<OrderDto>.Failure(validation.Error!);
        }

        order.SetStatus(request.Request.Status);
        if (request.Request.TrackingNumber is not null)
            order.SetTrackingNumber(request.Request.TrackingNumber);
        if (request.Request.Notes is not null)
            order.SetNotes(request.Request.Notes);

        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<OrderDto>.Success(OrderMappings.ToDto(order));
    }

    private async Task<Result<bool>> DecrementInventoryForCompletedOrder(Order order, CancellationToken cancellationToken)
    {
        var productMap = new Dictionary<Guid, Product>();
        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        foreach (var productId in productIds)
        {
            var product = await _productRepository.GetByIdAsync(productId, cancellationToken).ConfigureAwait(false);
            if (product is null)
                return Result<bool>.Failure($"Product {productId} not found for inventory update.");
            productMap[productId] = product;
        }

        foreach (var item in order.Items)
        {
            var product = productMap[item.ProductId];
            if (product.InventoryCount < item.Quantity)
                return Result<bool>.Failure($"Insufficient inventory for product '{product.Name}'.");
        }

        foreach (var item in order.Items)
        {
            var product = productMap[item.ProductId];
            var previousCount = product.InventoryCount;
            var newCount = previousCount - item.Quantity;
            var reason = $"Order {order.OrderNumber} completed.";
            const string changedBy = "system";

            product.UpdateInventory(newCount, reason, changedBy);
            _productRepository.Update(product);

            _inventoryLogRepository.Add(new InventoryLog(product.Id, previousCount, newCount, reason, changedBy));
        }

        return Result<bool>.Success(true);
    }

    private static bool IsValidTransition(OrderStatus from, OrderStatus to)
    {
        return from switch
        {
            OrderStatus.Pending => to is OrderStatus.Processing or OrderStatus.Cancelled,
            OrderStatus.Processing => to is OrderStatus.Shipped or OrderStatus.Cancelled,
            OrderStatus.Shipped => to is OrderStatus.Delivered,
            OrderStatus.Delivered => false,
            OrderStatus.Cancelled => false,
            _ => false
        };
    }
}
