using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record BulkDeleteProductsCommand(IReadOnlyCollection<Guid> ProductIds)
    : IRequest<Result<BulkOperationResultDto>>;
