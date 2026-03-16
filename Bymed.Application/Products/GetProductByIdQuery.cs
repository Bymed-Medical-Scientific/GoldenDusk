using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record GetProductByIdQuery(Guid Id) : IRequest<Result<ProductDto>>;
