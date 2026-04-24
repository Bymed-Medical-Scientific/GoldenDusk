using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Infrastructure.Files;
using FluentAssertions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace Bymed.Tests;

public class ImageUploadRoundTripPropertyTests : IDisposable
{
    private readonly string _tempRoot;

    public ImageUploadRoundTripPropertyTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "bymed-image-test-" + Guid.NewGuid().ToString("N"));
    }

    [Fact]
    public async Task ValidImage_UploadAndDelete_RoundTripSucceeds()
    {
        if (!OperatingSystem.IsWindows())
        {
            // System.Drawing-based image generation used by this test is Windows-only.
            return;
        }

        var options = Options.Create(new FileStorageOptions
        {
            RootPath = _tempRoot,
            PublicBaseUrl = "https://api.test.local/uploads/"
        });

        var logger = Substitute.For<ILogger<LocalFileStorageService>>();
        var hostEnv = Substitute.For<IHostEnvironment>();
        IFileStorageService storage = new LocalFileStorageService(options, hostEnv, logger);

        await using var imageStream = CreateTestPngImage(width: 800, height: 600);

        var saveResult = await storage.SaveProductImageAsync(
            imageStream,
            fileName: "test.png",
            contentType: "image/png",
            CancellationToken.None);

        saveResult.IsSuccess.Should().BeTrue("valid image uploads should succeed");
        saveResult.Value.Should().NotBeNull();

        var stored = saveResult.Value!;

        stored.OriginalUrl.Should().NotBeNullOrWhiteSpace();
        stored.Variants.Should().NotBeNull();
        stored.Variants.Should().NotBeEmpty("image variants should be generated");

        foreach (var variant in stored.Variants)
        {
            variant.Url.Should().StartWith("https://api.test.local/uploads/", "public URLs must be based on configured base URL");
            variant.Width.Should().BeGreaterThan(0);
            variant.Height.Should().BeGreaterThan(0);
        }

        var deleteOriginal = await storage.DeleteFileAsync(stored.OriginalUrl, CancellationToken.None);
        deleteOriginal.IsSuccess.Should().BeTrue("deleting original image should succeed");

        foreach (var variant in stored.Variants)
        {
            var deleteVariant = await storage.DeleteFileAsync(variant.Url, CancellationToken.None);
            deleteVariant.IsSuccess.Should().BeTrue("deleting variant image should succeed");
        }
    }

    private static MemoryStream CreateTestPngImage(int width, int height)
    {
        var stream = new MemoryStream();

        var data = new byte[width * height * 4];
        for (var i = 0; i < data.Length; i++)
        {
            data[i] = (byte)(i % 255);
        }

        using var bitmap = new System.Drawing.Bitmap(width, height, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
        var rect = new System.Drawing.Rectangle(0, 0, width, height);
        var bmpData = bitmap.LockBits(rect, System.Drawing.Imaging.ImageLockMode.WriteOnly, bitmap.PixelFormat);
        try
        {
            System.Runtime.InteropServices.Marshal.Copy(data, 0, bmpData.Scan0, data.Length);
        }
        finally
        {
            bitmap.UnlockBits(bmpData);
        }

        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
        stream.Position = 0;
        return stream;
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempRoot))
            {
                Directory.Delete(_tempRoot, recursive: true);
            }
        }
        catch
        {
            // Best-effort cleanup for test artifacts.
        }
    }
}

