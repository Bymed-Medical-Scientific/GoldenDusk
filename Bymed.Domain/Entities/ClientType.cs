using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class ClientType : FullAuditedEntity
{
    public const int NameMaxLength = 120;
    public const int SlugMaxLength = 120;

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;

    private ClientType()
    {
    }

    public ClientType(string name, string slug)
    {
        SetName(name);
        SetSlug(slug);
    }

    public void Update(string name, string slug)
    {
        SetName(name);
        SetSlug(slug);
    }

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Client type name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Client type name must not exceed {NameMaxLength} characters.", nameof(name));

        Name = trimmed;
    }

    private void SetSlug(string slug)
    {
        ArgumentNullException.ThrowIfNull(slug);
        var trimmed = slug.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Client type slug is required.", nameof(slug));
        if (trimmed.Length > SlugMaxLength)
            throw new ArgumentException($"Client type slug must not exceed {SlugMaxLength} characters.", nameof(slug));

        Slug = trimmed;
    }
}
