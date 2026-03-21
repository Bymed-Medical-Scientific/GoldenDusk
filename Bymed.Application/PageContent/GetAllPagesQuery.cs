using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record GetAllPagesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResult<PageContentDto>>;
