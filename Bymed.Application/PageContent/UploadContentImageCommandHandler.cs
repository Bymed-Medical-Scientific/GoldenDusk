using System.IO;
using Bymed.Application.Common;
using Bymed.Application.Files;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class UploadContentImageCommandHandler : IRequestHandler<UploadContentImageCommand, Result<ContentImageUploadDto>>
{
    private readonly IFileStorageService _fileStorageService;

    public UploadContentImageCommandHandler(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
    }

    public async Task<Result<ContentImageUploadDto>> Handle(UploadContentImageCommand request, CancellationToken cancellationToken)
    {
        if (request.FileBytes is null || request.FileBytes.Length == 0)
            return Result<ContentImageUploadDto>.Failure("Image file is required.");

        await using var stream = new MemoryStream(request.FileBytes, writable: false);

        var stored = await _fileStorageService
            .SaveProductImageAsync(stream, request.FileName, request.ContentType, cancellationToken)
            .ConfigureAwait(false);

        if (!stored.IsSuccess || stored.Value is null)
            return Result<ContentImageUploadDto>.Failure(stored.Error ?? "Failed to store image.");

        var originalUrl = stored.Value.OriginalUrl;
        var fileName = Path.GetFileName(originalUrl);
        if (string.IsNullOrEmpty(fileName))
            fileName = Path.GetFileName(request.FileName);

        var dto = new ContentImageUploadDto
        {
            Url = originalUrl,
            FileName = fileName
        };

        return Result<ContentImageUploadDto>.Success(dto);
    }
}
