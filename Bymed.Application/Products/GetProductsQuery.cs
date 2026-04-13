using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record GetProductsQuery(
    int PageNumber,
    int PageSize,
    Guid? CategoryId,
    string? Search,
    bool? InStock,
    string? Brand = null,
    string? ClientType = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null) : IRequest<PagedResult<ProductDto>>;
