using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Products;

public sealed record UploadProductImageCommand(
    Guid ProductId,
    byte[] FileBytes,
    string FileName,
    string ContentType,
    string? AltText) : IRequest<Result<ProductImageDto>>;

