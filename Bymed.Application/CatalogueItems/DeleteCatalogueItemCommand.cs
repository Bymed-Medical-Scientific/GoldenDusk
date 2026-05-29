using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record DeleteCatalogueItemCommand(Guid Id) : IRequest<Result>;
