using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class QuotationRepository : IQuotationRepository
{
    private readonly ApplicationDbContext _context;

    public QuotationRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public void Add(Quotation quotation)
    {
        ArgumentNullException.ThrowIfNull(quotation);
        _context.Quotations.Add(quotation);
    }

    public async Task<Quotation?> GetByIdAsync(Guid quotationId, CancellationToken cancellationToken = default)
    {
        if (quotationId == Guid.Empty)
            return null;

        return await _context.Quotations
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == quotationId, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Quotation?> GetByQuotationNumberAsync(string quotationNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(quotationNumber))
            return null;

        var normalized = quotationNumber.Trim().ToUpperInvariant();
        return await _context.Quotations
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.QuotationNumber.ToUpper() == normalized, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<bool> ExistsQuotationNumberAsync(
        string quotationNumber,
        Guid? excludeQuotationId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(quotationNumber))
            return false;

        var normalized = quotationNumber.Trim().ToUpperInvariant();
        return await _context.Quotations.AnyAsync(
            x => x.QuotationNumber.ToUpper() == normalized && (!excludeQuotationId.HasValue || x.Id != excludeQuotationId.Value),
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<PagedResult<Quotation>> GetPagedAsync(
        PaginationParams pagination,
        QuotationStatus? status,
        bool? hasPurchaseOrder,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Quotations
            .AsNoTracking()
            .Include(x => x.Items)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);
        if (hasPurchaseOrder.HasValue)
            query = query.Where(x => x.HasPurchaseOrder == hasPurchaseOrder.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.QuotationNumber.ToUpper().Contains(normalized) ||
                x.CustomerName.ToUpper().Contains(normalized) ||
                x.CustomerInstitution.ToUpper().Contains(normalized) ||
                x.CustomerEmail.ToUpper().Contains(normalized) ||
                x.Subject.ToUpper().Contains(normalized));
        }

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<Quotation>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }
}
