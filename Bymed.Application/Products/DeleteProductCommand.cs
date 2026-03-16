using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record DeleteProductCommand(Guid Id) : IRequest<Result>;
