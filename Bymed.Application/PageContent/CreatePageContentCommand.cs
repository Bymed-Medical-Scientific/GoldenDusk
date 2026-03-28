using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record CreatePageContentCommand(
    CreatePageContentRequest Request,
    string CreatedBy)
    : IRequest<Result<PageContentDto>>;
