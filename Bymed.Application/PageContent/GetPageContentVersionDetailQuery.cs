using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record GetPageContentVersionDetailQuery(string Slug, Guid VersionId)
    : IRequest<Result<ContentVersionDetailDto>>;
