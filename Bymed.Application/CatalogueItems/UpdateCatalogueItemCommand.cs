using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record UpdateCatalogueItemCommand(Guid Id, UpdateCatalogueItemRequest Request)
    : IRequest<Result<CatalogueItemDto>>;
