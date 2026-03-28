using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class GetPageContentVersionsQueryHandler
    : IRequestHandler<GetPageContentVersionsQuery, Result<PagedResult<ContentVersionSummaryDto>>>
{
    private readonly IPageContentRepository _pageContentRepository;

    public GetPageContentVersionsQueryHandler(IPageContentRepository pageContentRepository)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
    }

    public async Task<Result<PagedResult<ContentVersionSummaryDto>>> Handle(
        GetPageContentVersionsQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<PagedResult<ContentVersionSummaryDto>>.Failure("Slug is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<PagedResult<ContentVersionSummaryDto>>.Failure("Page not found.");

        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _pageContentRepository
            .GetVersionsForPageAsync(page.Id, pagination, cancellationToken)
            .ConfigureAwait(false);

        var items = paged.Items
            .Select(v => new ContentVersionSummaryDto
            {
                Id = v.Id,
                CreatedAt = v.CreatedAt,
                CreatedBy = v.CreatedBy
            })
            .ToList();

        return Result<PagedResult<ContentVersionSummaryDto>>.Success(
            new PagedResult<ContentVersionSummaryDto>(items, paged.PageNumber, paged.PageSize, paged.TotalCount));
    }
}
