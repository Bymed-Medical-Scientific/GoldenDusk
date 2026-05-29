using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record GetCatalogueItemBySlugQuery(string Slug) : IRequest<Result<CatalogueItemDto>>;
