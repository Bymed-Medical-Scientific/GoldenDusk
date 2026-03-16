using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record CreateProductCommand(CreateProductRequest Request) : IRequest<Result<ProductDto>>;
