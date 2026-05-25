using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record GetProductBySlugQuery(string Slug) : IRequest<Result<ProductDto>>;
