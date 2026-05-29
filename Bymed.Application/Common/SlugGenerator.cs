using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Bymed.Application.Common;

public static class SlugGenerator
{
    private static readonly Regex NonSlugCharacters = new(@"[^a-z0-9]+", RegexOptions.Compiled);
    private static readonly Regex RepeatedHyphens = new(@"-{2,}", RegexOptions.Compiled);

    /// <summary>
    /// Converts a display name into a URL-safe slug (lowercase letters, digits, hyphens).
    /// </summary>
    public static string FromName(string name, int maxLength)
    {
        if (maxLength <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxLength));

        ArgumentNullException.ThrowIfNull(name);
        if (string.IsNullOrWhiteSpace(name))
            return string.Empty;

        var withoutDiacritics = RemoveDiacritics(name.Trim()).ToLowerInvariant();
        var slug = RepeatedHyphens.Replace(NonSlugCharacters.Replace(withoutDiacritics, "-"), "-").Trim('-');

        if (slug.Length == 0)
            return string.Empty;

        if (slug.Length <= maxLength)
            return slug;

        var truncated = slug[..maxLength].TrimEnd('-');
        return truncated.Length > 0 ? truncated : slug[..maxLength];
    }

    public static string WithNumericSuffix(string baseSlug, int suffix, int maxLength)
    {
        if (suffix < 2)
            throw new ArgumentOutOfRangeException(nameof(suffix));

        var suffixText = $"-{suffix}";
        if (baseSlug.Length + suffixText.Length <= maxLength)
            return baseSlug + suffixText;

        var allowedBaseLength = maxLength - suffixText.Length;
        var trimmedBase = baseSlug[..allowedBaseLength].TrimEnd('-');
        if (trimmedBase.Length == 0)
            trimmedBase = "item";

        var candidate = trimmedBase + suffixText;
        return candidate.Length <= maxLength ? candidate : candidate[..maxLength].TrimEnd('-');
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
