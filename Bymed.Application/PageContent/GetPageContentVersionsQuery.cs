using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record GetPageContentVersionsQuery(string Slug, int PageNumber, int PageSize)
    : IRequest<Result<PagedResult<ContentVersionSummaryDto>>>;
