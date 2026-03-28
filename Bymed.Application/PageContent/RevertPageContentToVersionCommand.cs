using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record RevertPageContentToVersionCommand(string Slug, Guid VersionId, string ModifiedBy)
    : IRequest<Result<PageContentDto>>;
