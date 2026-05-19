using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class ClientContactPerson : BaseEntity
{
    public const int NameMaxLength = 150;
    public const int EmailMaxLength = 320;
    public const int PhoneMaxLength = 30;
    public const int FacultyMaxLength = 200;

    public Guid ClientId { get; private set; }
    public Client? Client { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? Phone { get; private set; }
    public string? Faculty { get; private set; }

    private ClientContactPerson()
    {
    }

    internal ClientContactPerson(Guid clientId, string name, string? email, string? phone, string? faculty)
    {
        if (clientId == Guid.Empty)
            throw new ArgumentException("Client id is required.", nameof(clientId));

        ClientId = clientId;
        SetName(name);
        Email = NormalizeOptional(email, EmailMaxLength, nameof(email));
        Phone = NormalizeOptional(phone, PhoneMaxLength, nameof(phone));
        Faculty = NormalizeOptional(faculty, FacultyMaxLength, nameof(faculty));
    }

    internal void Update(string name, string? email, string? phone, string? faculty)
    {
        SetName(name);
        Email = NormalizeOptional(email, EmailMaxLength, nameof(email));
        Phone = NormalizeOptional(phone, PhoneMaxLength, nameof(phone));
        Faculty = NormalizeOptional(faculty, FacultyMaxLength, nameof(faculty));
    }

    private void SetName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Contact person name is required.", nameof(name));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Name must not exceed {NameMaxLength} characters.", nameof(name));

        Name = trimmed;
    }

    private static string? NormalizeOptional(string? value, int maxLength, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new ArgumentException($"Value must not exceed {maxLength} characters.", parameterName);

        return trimmed;
    }
}
