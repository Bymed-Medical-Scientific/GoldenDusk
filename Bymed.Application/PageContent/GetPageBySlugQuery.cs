using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

/// <param name="AllowUnpublished">When false, draft pages return not found (public storefront).</param>
public sealed record GetPageBySlugQuery(string Slug, bool AllowUnpublished = false)
    : IRequest<Result<PageContentDto>>;
