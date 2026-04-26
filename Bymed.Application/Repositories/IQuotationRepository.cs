using Bymed.Application.Common;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;

namespace Bymed.Application.Repositories;

public interface IQuotationRepository
{
    void Add(Quotation quotation);
    Task<Quotation?> GetByIdAsync(Guid quotationId, CancellationToken cancellationToken = default);
    Task<Quotation?> GetByQuotationNumberAsync(string quotationNumber, CancellationToken cancellationToken = default);
    Task<bool> ExistsQuotationNumberAsync(string quotationNumber, Guid? excludeQuotationId = null, CancellationToken cancellationToken = default);
    Task<PagedResult<Quotation>> GetPagedAsync(
        PaginationParams pagination,
        QuotationStatus? status,
        bool? hasPurchaseOrder,
        string? search,
        CancellationToken cancellationToken = default);
}
