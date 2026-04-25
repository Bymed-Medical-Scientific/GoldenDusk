using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class GetQuotationsQueryHandler : IRequestHandler<GetQuotationsQuery, PagedResult<QuotationSummaryDto>>
{
    private readonly IQuotationRepository _quotationRepository;

    public GetQuotationsQueryHandler(IQuotationRepository quotationRepository)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
    }

    public async Task<PagedResult<QuotationSummaryDto>> Handle(GetQuotationsQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _quotationRepository
            .GetPagedAsync(pagination, request.Status, request.HasPurchaseOrder, request.Search, cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<QuotationSummaryDto>(
            paged.Items.Select(QuotationMappings.ToSummaryDto).ToList(),
            paged.PageNumber,
            paged.PageSize,
            paged.TotalCount);
    }
}
