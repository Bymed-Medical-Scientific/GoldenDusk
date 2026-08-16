using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record CreateCatalogueItemCommand(CreateCatalogueItemRequest Request)
    : IRequest<Result<CatalogueItemDto>>;
