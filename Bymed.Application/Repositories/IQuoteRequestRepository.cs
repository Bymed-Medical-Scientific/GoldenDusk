using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IQuoteRequestRepository
{
    void Add(QuoteRequest quoteRequest);
    Task<QuoteRequest?> GetByIdAsync(Guid quoteRequestId, CancellationToken cancellationToken = default);
    Task<PagedResult<QuoteRequest>> GetPagedAsync(
        PaginationParams pagination,
        string? email,
        string? fullName,
        string? institution,
        string? phoneNumber,
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        CancellationToken cancellationToken = default);
}
