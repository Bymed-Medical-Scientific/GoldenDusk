using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Client : FullAuditedEntity
{
    public const int InstitutionNameMaxLength = 250;
    public const int AddressMaxLength = 600;
    public const int EmailMaxLength = 320;
    public const int PhoneMaxLength = 30;
    public const int TelephoneMaxLength = 30;
    public const int ContactPersonNameMaxLength = 150;

    public string InstitutionName { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string? Email1 { get; private set; }
    public string? Email2 { get; private set; }
    public string? Email3 { get; private set; }
    public string? PhoneNumber1 { get; private set; }
    public string? PhoneNumber2 { get; private set; }
    public string? PhoneNumber3 { get; private set; }
    public string? TelephoneNumber1 { get; private set; }
    public string? TelephoneNumber2 { get; private set; }
    public string? TelephoneNumber3 { get; private set; }
    public string? ContactPerson1Name { get; private set; }
    public string? ContactPerson1Email { get; private set; }
    public string? ContactPerson1Telephone { get; private set; }
    public string? ContactPerson2Name { get; private set; }
    public string? ContactPerson2Email { get; private set; }
    public string? ContactPerson2Telephone { get; private set; }
    public Guid ClientTypeId { get; private set; }
    public ClientType? ClientType { get; private set; }

    private Client()
    {
    }

    public Client(
        string institutionName,
        string address,
        Guid clientTypeId,
        string? email1,
        string? email2,
        string? email3,
        string? phoneNumber1,
        string? phoneNumber2,
        string? phoneNumber3,
        string? telephoneNumber1,
        string? telephoneNumber2,
        string? telephoneNumber3,
        string? contactPerson1Name,
        string? contactPerson1Email,
        string? contactPerson1Telephone,
        string? contactPerson2Name,
        string? contactPerson2Email,
        string? contactPerson2Telephone)
    {
        Update(
            institutionName,
            address,
            clientTypeId,
            email1,
            email2,
            email3,
            phoneNumber1,
            phoneNumber2,
            phoneNumber3,
            telephoneNumber1,
            telephoneNumber2,
            telephoneNumber3,
            contactPerson1Name,
            contactPerson1Email,
            contactPerson1Telephone,
            contactPerson2Name,
            contactPerson2Email,
            contactPerson2Telephone);
    }

    public void Update(
        string institutionName,
        string address,
        Guid clientTypeId,
        string? email1,
        string? email2,
        string? email3,
        string? phoneNumber1,
        string? phoneNumber2,
        string? phoneNumber3,
        string? telephoneNumber1,
        string? telephoneNumber2,
        string? telephoneNumber3,
        string? contactPerson1Name,
        string? contactPerson1Email,
        string? contactPerson1Telephone,
        string? contactPerson2Name,
        string? contactPerson2Email,
        string? contactPerson2Telephone)
    {
        SetInstitutionName(institutionName);
        SetAddress(address);
        SetClientType(clientTypeId);
        Email1 = Normalize(email1, EmailMaxLength, nameof(email1));
        Email2 = Normalize(email2, EmailMaxLength, nameof(email2));
        Email3 = Normalize(email3, EmailMaxLength, nameof(email3));
        PhoneNumber1 = Normalize(phoneNumber1, PhoneMaxLength, nameof(phoneNumber1));
        PhoneNumber2 = Normalize(phoneNumber2, PhoneMaxLength, nameof(phoneNumber2));
        PhoneNumber3 = Normalize(phoneNumber3, PhoneMaxLength, nameof(phoneNumber3));
        TelephoneNumber1 = Normalize(telephoneNumber1, TelephoneMaxLength, nameof(telephoneNumber1));
        TelephoneNumber2 = Normalize(telephoneNumber2, TelephoneMaxLength, nameof(telephoneNumber2));
        TelephoneNumber3 = Normalize(telephoneNumber3, TelephoneMaxLength, nameof(telephoneNumber3));
        ContactPerson1Name = Normalize(contactPerson1Name, ContactPersonNameMaxLength, nameof(contactPerson1Name));
        ContactPerson1Email = Normalize(contactPerson1Email, EmailMaxLength, nameof(contactPerson1Email));
        ContactPerson1Telephone = Normalize(contactPerson1Telephone, TelephoneMaxLength, nameof(contactPerson1Telephone));
        ContactPerson2Name = Normalize(contactPerson2Name, ContactPersonNameMaxLength, nameof(contactPerson2Name));
        ContactPerson2Email = Normalize(contactPerson2Email, EmailMaxLength, nameof(contactPerson2Email));
        ContactPerson2Telephone = Normalize(contactPerson2Telephone, TelephoneMaxLength, nameof(contactPerson2Telephone));
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
