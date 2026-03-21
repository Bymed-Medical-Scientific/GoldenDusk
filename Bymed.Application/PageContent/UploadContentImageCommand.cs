using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed record UploadContentImageCommand(
    byte[] FileBytes,
    string FileName,
    string ContentType) : IRequest<Result<ContentImageUploadDto>>;
