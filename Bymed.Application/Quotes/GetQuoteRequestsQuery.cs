using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotes;

public sealed record GetQuoteRequestsQuery(
    int PageNumber = 1,
    int PageSize = PaginationParams.DefaultPageSize,
    string? Email = null,
    string? FullName = null,
    string? Institution = null,
    string? PhoneNumber = null,
    DateTime? DateFromUtc = null,
    DateTime? DateToUtc = null) : IRequest<PagedResult<QuoteRequestSummaryDto>>;
