namespace Bymed.Infrastructure.Files;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    // Root directory on disk where files will be stored, e.g. "wwwroot/uploads".
    // Relative paths resolve against IHostEnvironment.ContentRootPath (API project dir), not AppContext.BaseDirectory (bin/).
    public string RootPath { get; set; } = "wwwroot/uploads";

    // Base URL used to construct public file URLs, e.g. "https://api.example.com/uploads".
    // Local default assumes ASP.NET Core serves static files from wwwroot at /.
    public string PublicBaseUrl { get; set; } = "/uploads/";

    // Maximum allowed file size in bytes. Defaults to 5 MB.
    public long MaxFileSizeBytes { get; set; } = 5L * 1024 * 1024;

    // Allowed image content types.
    public string[] AllowedContentTypes { get; set; } = ["image/jpeg", "image/png", "image/webp"];
}

