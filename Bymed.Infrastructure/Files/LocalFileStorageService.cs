using System.Diagnostics.CodeAnalysis;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace Bymed.Infrastructure.Files;

public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly (int Width, string Name)[] ImageVariants =
    [
        (150, "thumb"),
        (600, "medium")
    ];

    private readonly FileStorageOptions _options;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(
        IOptions<FileStorageOptions> options,
        ILogger<LocalFileStorageService> logger)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<StoredImageResult>> SaveProductImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        if (fileStream is null)
            return Result<StoredImageResult>.Failure("File stream is required.");

        if (string.IsNullOrWhiteSpace(fileName))
            return Result<StoredImageResult>.Failure("File name is required.");

        if (string.IsNullOrWhiteSpace(contentType))
            return Result<StoredImageResult>.Failure("Content type is required.");

        if (!_options.AllowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            return Result<StoredImageResult>.Failure("Unsupported file type.");

        if (!fileStream.CanRead)
            return Result<StoredImageResult>.Failure("Cannot read file stream.");

        try
        {
            using var memory = new MemoryStream();
            await fileStream.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

            if (memory.Length == 0)
                return Result<StoredImageResult>.Failure("File is empty.");

            if (memory.Length > _options.MaxFileSizeBytes)
                return Result<StoredImageResult>.Failure("File is too large.");

            memory.Position = 0;

            var extension = GetSafeExtension(contentType, fileName);
            var fileId = Guid.NewGuid().ToString("N");
            var originalFileName = $"{fileId}{extension}";

            var root = EnsureRootDirectory();
            var originalPath = Path.Combine(root, "original", originalFileName);
            Directory.CreateDirectory(Path.GetDirectoryName(originalPath)!);

            await using (var originalFile = File.Create(originalPath))
            {
                memory.Position = 0;
                await memory.CopyToAsync(originalFile, cancellationToken).ConfigureAwait(false);
            }

            var variants = new List<StoredImageVariant>();

            memory.Position = 0;
            using (var image = await Image.LoadAsync(memory, cancellationToken).ConfigureAwait(false))
            {
                var encoder = GetEncoder(contentType);

                foreach (var (width, name) in ImageVariants)
                {
                    var variantFileName = $"{fileId}_{name}{extension}";
                    var variantPath = Path.Combine(root, name, variantFileName);
                    Directory.CreateDirectory(Path.GetDirectoryName(variantPath)!);

                    using var clone = image.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(width, 0)
                    }));

                    await clone.SaveAsync(variantPath, encoder, cancellationToken).ConfigureAwait(false);

                    variants.Add(new StoredImageVariant(
                        BuildPublicUrl(name, variantFileName),
                        clone.Width,
                        clone.Height));
                }

                var originalUrl = BuildPublicUrl("original", originalFileName);

                return Result<StoredImageResult>.Success(
                    new StoredImageResult(originalUrl, variants));
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to save product image.");
            return Result<StoredImageResult>.Failure("Failed to save product image.");
        }
    }

    public Task<Result> DeleteFileAsync(
        string fileUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return Task.FromResult(Result.Failure("File URL is required."));

        try
        {
            var root = EnsureRootDirectory();
            var baseUrl = NormalizeBaseUrl(_options.PublicBaseUrl);

            if (string.IsNullOrWhiteSpace(baseUrl) || !fileUrl.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase))
                return Task.FromResult(Result.Failure("File URL is not managed by this storage provider."));

            var relative = fileUrl[baseUrl.Length..].TrimStart('/');
            var path = Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(path))
            {
                File.Delete(path);
            }

            return Task.FromResult(Result.Success());
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to delete file at URL {FileUrl}.", fileUrl);
            return Task.FromResult(Result.Failure("Failed to delete file."));
        }
    }

    private string EnsureRootDirectory()
    {
        var root = _options.RootPath;
        if (string.IsNullOrWhiteSpace(root))
            throw new InvalidOperationException("FileStorage:RootPath must be configured.");

        if (!Path.IsPathRooted(root))
        {
            root = Path.GetFullPath(root, AppContext.BaseDirectory);
        }

        Directory.CreateDirectory(root);
        return root;
    }

    private static string GetSafeExtension(string contentType, string fileName)
    {
        if (contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
            return ".png";
        if (contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase))
            return ".jpg";
        if (contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase))
            return ".webp";

        var ext = Path.GetExtension(fileName);
        return string.IsNullOrWhiteSpace(ext) ? ".img" : ext;
    }

    private static IImageEncoder GetEncoder(string contentType)
    {
        if (contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
            return new PngEncoder();
        return new JpegEncoder { Quality = 85 };
    }

    private string BuildPublicUrl(string folder, string fileName)
    {
        var baseUrl = NormalizeBaseUrl(_options.PublicBaseUrl);
        var relative = $"{folder}/{fileName}";

        return string.IsNullOrWhiteSpace(baseUrl)
            ? relative.Replace('\\', '/')
            : $"{baseUrl}{relative}";
    }

    [SuppressMessage("Design", "CA1055:Uri return values should not be strings", Justification = "Public URLs are simple strings for API clients.")]
    private static string NormalizeBaseUrl(string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return string.Empty;

        var trimmed = baseUrl.Trim();
        if (!trimmed.EndsWith("/", StringComparison.Ordinal))
            trimmed += "/";
        return trimmed;
    }
}

