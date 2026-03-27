using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record ImportProductsCsvCommand(byte[] Content) : IRequest<Result<ImportProductsResultDto>>;
