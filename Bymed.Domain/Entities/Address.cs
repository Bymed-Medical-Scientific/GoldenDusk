using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public class Address : BaseEntity
{
    public const int NameMaxLength = 200;
    public const int LineMaxLength = 300;
    public const int CityMaxLength = 100;
    public const int StateMaxLength = 100;
    public const int PostalCodeMaxLength = 20;
    public const int CountryMaxLength = 100;
    public const int PhoneMaxLength = 30;

    public Guid? UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string AddressLine1 { get; private set; } = string.Empty;
    public string? AddressLine2 { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }

    public User? User { get; private set; }

    private Address()
    {
    }

    public Address(
        Guid? userId,
        string name,
        string addressLine1,
        string? addressLine2,
        string city,
        string state,
        string postalCode,
        string country,
        string phone,
        bool isDefault = false)
    {
        UserId = userId;
        SetName(name);
        SetAddressLine1(addressLine1);
        AddressLine2 = ValidateOptional(addressLine2, LineMaxLength, nameof(addressLine2));
        SetCity(city);
        SetState(state);
        SetPostalCode(postalCode);
        SetCountry(country);
        SetPhone(phone);
        IsDefault = isDefault;
    }

    public void Update(
        string name,
        string addressLine1,
        string? addressLine2,
        string city,
        string state,
        string postalCode,
        string country,
        string phone,
        bool isDefault)
    {
        SetName(name);
        SetAddressLine1(addressLine1);
        AddressLine2 = ValidateOptional(addressLine2, LineMaxLength, nameof(addressLine2));
        SetCity(city);
        SetState(state);
        SetPostalCode(postalCode);
        SetCountry(country);
        SetPhone(phone);
        IsDefault = isDefault;
    }

    public void SetAsDefault() => IsDefault = true;
    public void ClearDefault() => IsDefault = false;

    private static string ValidateRequired(string value, int maxLength, string paramName)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException($"{paramName} is required.", paramName);
        if (trimmed.Length > maxLength)
            throw new ArgumentException($"{paramName} must not exceed {maxLength} characters.", paramName);
        return trimmed;
    }

    private static string? ValidateOptional(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
            throw new ArgumentException($"{paramName} must not exceed {maxLength} characters.", paramName);
        return trimmed;
    }

    private void SetName(string value) => Name = ValidateRequired(value, NameMaxLength, nameof(Name));
    private void SetAddressLine1(string value) => AddressLine1 = ValidateRequired(value, LineMaxLength, nameof(AddressLine1));
    private void SetCity(string value) => City = ValidateRequired(value, CityMaxLength, nameof(City));
    private void SetState(string value) => State = ValidateRequired(value, StateMaxLength, nameof(State));
    private void SetPostalCode(string value) => PostalCode = ValidateRequired(value, PostalCodeMaxLength, nameof(PostalCode));
    private void SetCountry(string value) => Country = ValidateRequired(value, CountryMaxLength, nameof(Country));
    private void SetPhone(string value) => Phone = ValidateRequired(value, PhoneMaxLength, nameof(Phone));
}
