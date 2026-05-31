using Bymed.Application.Repositories;

namespace Bymed.Application.Orders;

public sealed class OrderNumberGenerator : IOrderNumberGenerator
{
    private const int MaxAttempts = 100;

    private readonly IOrderRepository _orderRepository;

    public OrderNumberGenerator(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public async Task<string> GenerateAsync(string customerName, CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(utcNow);
        var baseCount = await _orderRepository
            .GetDailyOrderCountAsync(today, cancellationToken)
            .ConfigureAwait(false);

        for (var offset = 1; offset <= MaxAttempts; offset++)
        {
            var candidate = OrderNumberFormatter.Format(baseCount + offset, customerName, utcNow);
            var existing = await _orderRepository
                .GetByOrderNumberAsync(candidate, cancellationToken)
                .ConfigureAwait(false);

            if (existing is null)
                return candidate;
        }

        throw new InvalidOperationException("Unable to generate a unique order number.");
    }
}
