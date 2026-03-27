using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record BulkSetProductAvailabilityCommand(IReadOnlyCollection<Guid> ProductIds, bool IsAvailable)
    : IRequest<Result<BulkOperationResultDto>>;
