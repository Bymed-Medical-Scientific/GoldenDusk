using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Orders;

public sealed record ExportOrdersQuery(
    OrderStatus? Status,
    DateTime? DateFrom,
    DateTime? DateTo,
    string? Search = null) : IRequest<IAsyncEnumerable<string>>;
