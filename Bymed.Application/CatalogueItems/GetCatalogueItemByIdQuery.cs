using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record GetCatalogueItemByIdQuery(Guid Id) : IRequest<Result<CatalogueItemDto>>;
