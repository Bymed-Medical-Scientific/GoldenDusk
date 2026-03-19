using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed class ExportOrdersQueryHandler : IRequestHandler<ExportOrdersQuery, IAsyncEnumerable<string>>
{
    private readonly IOrderRepository _orderRepository;

    public ExportOrdersQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
    }

    public Task<IAsyncEnumerable<string>> Handle(ExportOrdersQuery request, CancellationToken cancellationToken)
    {
        var lines = ExportOrdersAsync(request.Status, request.DateFrom, request.DateTo, cancellationToken);
        return Task.FromResult(lines);
    }

    private async IAsyncEnumerable<string> ExportOrdersAsync(
        OrderStatus? status,
        DateTime? dateFrom,
        DateTime? dateTo,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var header = "Id,OrderNumber,IdempotencyKey,UserId,Status,CustomerEmail,CustomerName," +
                     "Subtotal,Tax,ShippingCost,Total,Currency,ExchangeRate,PaymentStatus,PaymentReference,PaymentMethod," +
                     "TrackingNumber,Notes,CreationTime,CreatorId,LastModificationTime,LastModifierUserId," +
                     "ShippingName,ShippingAddressLine1,ShippingAddressLine2,ShippingCity,ShippingState,ShippingPostalCode,ShippingCountry,ShippingPhone," +
                     "OrderItemId,ProductId,ProductName,ProductImageUrl,Quantity,PricePerUnit,ItemSubtotal";
        yield return header;

        await foreach (var order in _orderRepository.GetOrdersForExportAsync(status, dateFrom, dateTo, cancellationToken))
        {
            var sa = order.ShippingAddress;
            var orderPrefix = string.Join(",",
                CsvEscape(order.Id.ToString()),
                CsvEscape(order.OrderNumber),
                CsvEscape(order.IdempotencyKey),
                CsvEscape(order.UserId?.ToString()),
                CsvEscape(order.Status.ToString()),
                CsvEscape(order.CustomerEmail),
                CsvEscape(order.CustomerName),
                CsvEscape(order.Subtotal.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(order.Tax.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(order.ShippingCost.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(order.Total.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(order.Currency),
                CsvEscape(order.ExchangeRate.ToString(CultureInfo.InvariantCulture)),
                CsvEscape(order.PaymentStatus.ToString()),
                CsvEscape(order.PaymentReference),
                CsvEscape(order.PaymentMethod),
                CsvEscape(order.TrackingNumber),
                CsvEscape(order.Notes),
                CsvEscape(order.CreationTime.ToString("O")),
                CsvEscape(order.CreatorId?.ToString()),
                CsvEscape(order.LastModificationTime?.ToString("O")),
                CsvEscape(order.LastModifierUserId?.ToString()),
                CsvEscape(sa.Name),
                CsvEscape(sa.AddressLine1),
                CsvEscape(sa.AddressLine2),
                CsvEscape(sa.City),
                CsvEscape(sa.State),
                CsvEscape(sa.PostalCode),
                CsvEscape(sa.Country),
                CsvEscape(sa.Phone));

            foreach (var item in order.Items)
            {
                var line = orderPrefix + "," +
                    CsvEscape(item.Id.ToString()) + "," +
                    CsvEscape(item.ProductId.ToString()) + "," +
                    CsvEscape(item.ProductName) + "," +
                    CsvEscape(item.ProductImageUrl) + "," +
                    CsvEscape(item.Quantity.ToString()) + "," +
                    CsvEscape(item.PricePerUnit.ToString(CultureInfo.InvariantCulture)) + "," +
                    CsvEscape(item.Subtotal.ToString(CultureInfo.InvariantCulture));
                yield return line;
            }
        }
    }

    private static string CsvEscape(string? value)
    {
        if (value is null)
            return string.Empty;
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
