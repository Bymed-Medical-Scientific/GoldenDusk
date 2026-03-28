using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record DeletePageContentCommand(string Slug) : IRequest<Result<Unit>>;
