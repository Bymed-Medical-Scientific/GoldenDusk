using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Brand : FullAuditedEntity
{
    public const int NameMaxLength = 120;
    public const int LogoUrlMaxLength = 500;
    public const int WebsiteUrlMaxLength = 500;

    public string Name { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public string? WebsiteUrl { get; private set; }

    private Brand()
    {
    }

    public Brand(string name, string? websiteUrl = null)
    {
        SetName(name);
        WebsiteUrl = NormalizeWebsiteUrl(websiteUrl);
    }

    public void Update(string name, string? websiteUrl = null)
    {
        SetName(name);
        WebsiteUrl = NormalizeWebsiteUrl(websiteUrl);
    }

    public void SetLogoUrl(string? logoUrl)
    {
        if (string.IsNullOrWhiteSpace(logoUrl))
        {
            LogoUrl = null;
            return;
        }

        var trimmed = logoUrl.Trim();
        if (trimmed.Length > LogoUrlMaxLength)
            throw new ArgumentException($"Logo URL must not exceed {LogoUrlMaxLength} characters.", nameof(logoUrl));
        LogoUrl = trimmed;
    }

    public void ClearLogo() => LogoUrl = null;

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Brand name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Brand name must not exceed {NameMaxLength} characters.", nameof(name));
        Name = trimmed;
    }

    public static string? NormalizeWebsiteUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        var trimmed = url.Trim();
        if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            && !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = "https://" + trimmed;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("Website URL must be a valid http or https address.", nameof(url));
        }

        var normalized = uri.ToString();
        if (normalized.Length > WebsiteUrlMaxLength)
            throw new ArgumentException($"Website URL must not exceed {WebsiteUrlMaxLength} characters.", nameof(url));

        return normalized;
    }
}
