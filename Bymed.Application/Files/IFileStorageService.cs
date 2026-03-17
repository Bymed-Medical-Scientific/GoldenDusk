using Bymed.Application.Common;

namespace Bymed.Application.Files;

public sealed record StoredImageVariant(string Url, int Width, int Height);

public sealed record StoredImageResult(string OriginalUrl, IReadOnlyList<StoredImageVariant> Variants);

public interface IFileStorageService
{
    Task<Result<StoredImageResult>> SaveProductImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Result> DeleteFileAsync(
        string fileUrl,
        CancellationToken cancellationToken = default);
}

