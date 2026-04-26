using Bymed.Application.Common;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record GetQuotationsQuery(
    int PageNumber = 1,
    int PageSize = PaginationParams.DefaultPageSize,
    QuotationStatus? Status = null,
    bool? HasPurchaseOrder = null,
    string? Search = null) : IRequest<PagedResult<QuotationSummaryDto>>;
