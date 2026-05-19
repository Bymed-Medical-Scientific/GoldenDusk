using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Client : FullAuditedEntity
{
    public const int InstitutionNameMaxLength = 250;
    public const int AddressMaxLength = 600;
    public const int EmailMaxLength = 320;
    public const int PhoneMaxLength = 30;
    public const int TelephoneMaxLength = 30;

    public string InstitutionName { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string? Phone { get; private set; }
    public string? Telephone { get; private set; }
    public Guid ClientTypeId { get; private set; }
    public ClientType? ClientType { get; private set; }
    public ICollection<ClientContactPerson> ContactPersons { get; private set; } = new List<ClientContactPerson>();

    private Client()
    {
    }

    public Client(
        string institutionName,
        string address,
        Guid clientTypeId,
        string? email,
        string? phone,
        string? telephone)
    {
        Update(institutionName, address, clientTypeId, email, phone, telephone);
    }

    public void Update(
        string institutionName,
        string address,
        Guid clientTypeId,
        string? email,
        string? phone,
        string? telephone)
    {
        SetInstitutionName(institutionName);
        SetAddress(address);
        SetClientType(clientTypeId);
        Email = Normalize(email, EmailMaxLength, nameof(email));
        Phone = Normalize(phone, PhoneMaxLength, nameof(phone));
        Telephone = Normalize(telephone, TelephoneMaxLength, nameof(telephone));
    }

    public void ReplaceContactPersons(IReadOnlyList<ClientContactPersonInput> contactPersons)
    {
        ArgumentNullException.ThrowIfNull(contactPersons);
        ContactPersons.Clear();

        foreach (var input in contactPersons)
        {
            if (string.IsNullOrWhiteSpace(input.Name))
                continue;

            ContactPersons.Add(new ClientContactPerson(Id, input.Name, input.Email, input.Phone, input.Faculty));
        }
    }

    private void SetInstitutionName(string institutionName)
    {
        ArgumentNullException.ThrowIfNull(institutionName);
        var trimmed = institutionName.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Institution name is required.", nameof(institutionName));
        if (trimmed.Length > InstitutionNameMaxLength)
            throw new ArgumentException(
                $"Institution name must not exceed {InstitutionNameMaxLength} characters.",
                nameof(institutionName));

        InstitutionName = trimmed;
    }

    private void SetAddress(string address)
    {
        ArgumentNullException.ThrowIfNull(address);
        var trimmed = address.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Address is required.", nameof(address));
        if (trimmed.Length > AddressMaxLength)
            throw new ArgumentException($"Address must not exceed {AddressMaxLength} characters.", nameof(address));

        Address = trimmed;
    }

    private void SetClientType(Guid clientTypeId)
    {
        if (clientTypeId == Guid.Empty)
            throw new ArgumentException("Client type is required.", nameof(clientTypeId));
        ClientTypeId = clientTypeId;
    }

    private static string? Normalize(string? value, int maxLength, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new ArgumentException($"Value must not exceed {maxLength} characters.", parameterName);

        return trimmed;
    }
}

public sealed record ClientContactPersonInput(string Name, string? Email, string? Phone, string? Faculty);
