using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record DeleteCatalogueItemImageCommand(Guid CatalogueItemId, Guid ImageId) : IRequest<Result>;
