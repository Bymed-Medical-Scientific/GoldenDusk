using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record GetProductsQuery(
    int PageNumber,
    int PageSize,
    Guid? CategoryId,
    string? Search,
    bool? InStock) : IRequest<PagedResult<ProductDto>>;
