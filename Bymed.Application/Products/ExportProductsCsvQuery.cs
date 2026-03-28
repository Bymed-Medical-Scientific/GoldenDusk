using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record ExportProductsCsvQuery(IReadOnlyCollection<Guid>? ProductIds = null)
    : IRequest<Result<string>>;
