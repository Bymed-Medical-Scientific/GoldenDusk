namespace Bymed.Application.Common;

public static class UniqueSlugGenerator
{
    public static async Task<string> GenerateUniqueAsync(
        string name,
        int maxLength,
        string fallbackSlug,
        Func<string, CancellationToken, Task<bool>> slugExistsAsync,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(fallbackSlug);
        ArgumentNullException.ThrowIfNull(slugExistsAsync);

        if (maxLength <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxLength));

        var baseSlug = SlugGenerator.FromName(name, maxLength);
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = fallbackSlug;

        var candidate = baseSlug;
        var suffix = 2;

        while (await slugExistsAsync(candidate, cancellationToken).ConfigureAwait(false))
        {
            candidate = SlugGenerator.WithNumericSuffix(baseSlug, suffix++, maxLength);
        }

        return candidate;
    }
}
