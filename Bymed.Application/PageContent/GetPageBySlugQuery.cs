using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record GetPageBySlugQuery(string Slug) : IRequest<Result<PageContentDto>>;
