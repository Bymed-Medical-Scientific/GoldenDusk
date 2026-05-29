using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed record UploadCatalogueItemImageCommand(
    Guid CatalogueItemId,
    byte[] FileBytes,
    string FileName,
    string ContentType,
    string? AltText) : IRequest<Result<CatalogueItemImageDto>>;
