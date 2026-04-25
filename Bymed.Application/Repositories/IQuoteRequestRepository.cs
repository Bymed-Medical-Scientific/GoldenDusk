using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IQuoteRequestRepository
{
    void Add(QuoteRequest quoteRequest);
    Task<PagedResult<QuoteRequest>> GetPagedAsync(
        PaginationParams pagination,
        string? email,
        string? fullName,
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        CancellationToken cancellationToken = default);
}
