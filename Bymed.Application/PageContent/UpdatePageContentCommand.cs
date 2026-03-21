using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record UpdatePageContentCommand(string Slug, UpdatePageContentRequest Request, string ModifiedBy)
    : IRequest<Result<PageContentDto>>;
