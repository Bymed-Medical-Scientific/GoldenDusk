using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record UpdateProductCommand(Guid Id, UpdateProductRequest Request) : IRequest<Result<ProductDto>>;
