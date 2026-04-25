using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Contact;

public sealed record GetContactMessagesQuery(
    int PageNumber = 1,
    int PageSize = PaginationParams.DefaultPageSize,
    string? Email = null,
    string? Subject = null,
    DateTime? DateFromUtc = null,
    DateTime? DateToUtc = null) : IRequest<PagedResult<ContactMessageSummaryDto>>;
