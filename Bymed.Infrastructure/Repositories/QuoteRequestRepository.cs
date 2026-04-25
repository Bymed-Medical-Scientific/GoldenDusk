using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class QuoteRequestRepository : IQuoteRequestRepository
{
    private readonly ApplicationDbContext _context;

    public QuoteRequestRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public void Add(QuoteRequest quoteRequest)
    {
        ArgumentNullException.ThrowIfNull(quoteRequest);
        _context.QuoteRequests.Add(quoteRequest);
    }

    public async Task<PagedResult<QuoteRequest>> GetPagedAsync(
        PaginationParams pagination,
        string? email,
        string? fullName,
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        CancellationToken cancellationToken = default)
    {
        var query = _context.QuoteRequests
            .AsNoTracking()
            .Include(x => x.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(email))
        {
            var normalized = email.Trim().ToUpperInvariant();
            query = query.Where(x => x.Email.ToUpper().Contains(normalized));
        }

        if (!string.IsNullOrWhiteSpace(fullName))
        {
            var normalized = fullName.Trim().ToUpperInvariant();
            query = query.Where(x => x.FullName.ToUpper().Contains(normalized));
        }

        if (dateFromUtc.HasValue)
            query = query.Where(x => x.SubmittedAtUtc >= dateFromUtc.Value);
        if (dateToUtc.HasValue)
            query = query.Where(x => x.SubmittedAtUtc <= dateToUtc.Value);

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(x => x.SubmittedAtUtc)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<QuoteRequest>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }
}
