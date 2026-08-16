using Bymed.Application.Common;
using Bymed.Application.Notifications;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    public UpdateOrderStatusCommandHandler(
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        IEmailService emailService)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    }

    public async Task<Result<OrderDto>> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(request.OrderId, cancellationToken).ConfigureAwait(false);
        if (order is null)
            return Result<OrderDto>.Failure("Order not found.");

        if (!IsValidTransition(order.Status, request.Request.Status))
            return Result<OrderDto>.Failure($"Invalid status transition from {order.Status} to {request.Request.Status}.");

        order.SetStatus(request.Request.Status);
        if (request.Request.TrackingNumber is not null)
            order.SetTrackingNumber(request.Request.TrackingNumber);
        if (request.Request.Notes is not null)
            order.SetNotes(request.Request.Notes);

        _orderRepository.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await SendOrderStatusNotificationAsync(order, request.Request.Status, cancellationToken).ConfigureAwait(false);

        return Result<OrderDto>.Success(OrderMappings.ToDto(order));
    }

    private Task SendOrderStatusNotificationAsync(Order order, OrderStatus status, CancellationToken cancellationToken)
    {
        return status switch
        {
            OrderStatus.Shipped => _emailService.SendShippingNotificationAsync(
                order.CustomerEmail,
                order.CustomerName,
                order.OrderNumber,
                order.TrackingNumber ?? "N/A",
                cancellationToken),
            OrderStatus.Delivered => _emailService.SendDeliveryConfirmationAsync(
                order.CustomerEmail,
                order.CustomerName,
                order.OrderNumber,
                cancellationToken),
            _ => Task.CompletedTask
        };
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
