using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record DeleteProductImageCommand(Guid ProductId, Guid ImageId) : IRequest<Result>;

