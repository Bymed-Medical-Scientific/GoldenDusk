using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

/// <param name="PublishedOnly">When true, only published pages are returned (public list).</param>
public sealed record GetAllPagesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    bool PublishedOnly = false)
    : IRequest<PagedResult<PageContentDto>>;
