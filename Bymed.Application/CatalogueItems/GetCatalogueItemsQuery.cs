using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record GetCatalogueItemsQuery(
    int PageNumber,
    int PageSize,
    Guid? CategoryId,
    string? Search,
    string? Brand = null,
    bool? IsPublished = null) : IRequest<PagedResult<CatalogueItemDto>>;
