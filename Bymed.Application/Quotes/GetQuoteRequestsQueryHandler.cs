using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotes;

public sealed class GetQuoteRequestsQueryHandler : IRequestHandler<GetQuoteRequestsQuery, PagedResult<QuoteRequestSummaryDto>>
{
    private readonly IQuoteRequestRepository _quoteRequestRepository;

    public GetQuoteRequestsQueryHandler(IQuoteRequestRepository quoteRequestRepository)
    {
        _quoteRequestRepository = quoteRequestRepository ?? throw new ArgumentNullException(nameof(quoteRequestRepository));
    }

    public async Task<PagedResult<QuoteRequestSummaryDto>> Handle(GetQuoteRequestsQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _quoteRequestRepository.GetPagedAsync(
                pagination,
                request.Email,
                request.FullName,
                request.DateFromUtc,
                request.DateToUtc,
                cancellationToken)
            .ConfigureAwait(false);

        var items = paged.Items.Select(x => new QuoteRequestSummaryDto
        {
            Id = x.Id,
            FullName = x.FullName,
            Institution = x.Institution,
            Email = x.Email,
            PhoneNumber = x.PhoneNumber,
            Address = x.Address,
            Notes = x.Notes,
            Status = x.Status,
            SubmittedAtUtc = x.SubmittedAtUtc,
            ItemCount = x.Items.Count
        }).ToList();

        return new PagedResult<QuoteRequestSummaryDto>(items, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }
}
