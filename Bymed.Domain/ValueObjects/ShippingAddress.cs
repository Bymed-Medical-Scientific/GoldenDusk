namespace Bymed.Domain.ValueObjects;

public sealed record ShippingAddress
{
    public const int NameMaxLength = 200;
    public const int LineMaxLength = 300;
    public const int CityMaxLength = 100;
    public const int StateMaxLength = 100;
    public const int PostalCodeMaxLength = 20;
    public const int CountryMaxLength = 100;
    public const int PhoneMaxLength = 30;

    public string Name { get; }
    public string AddressLine1 { get; }
    public string? AddressLine2 { get; }
    public string City { get; }
    public string State { get; }
    public string PostalCode { get; }
    public string Country { get; }
    public string Phone { get; }

    public ShippingAddress(
        string name,
        string addressLine1,
        string? addressLine2,
        string city,
        string state,
        string postalCode,
        string country,
        string phone)
    {
        Name = ValidateRequired(name, NameMaxLength, nameof(name));
        AddressLine1 = ValidateRequired(addressLine1, LineMaxLength, nameof(addressLine1));
        AddressLine2 = ValidateOptional(addressLine2, LineMaxLength, nameof(addressLine2));
        City = ValidateRequired(city, CityMaxLength, nameof(city));
        State = ValidateRequired(state, StateMaxLength, nameof(state));
        PostalCode = ValidateRequired(postalCode, PostalCodeMaxLength, nameof(postalCode));
        Country = ValidateRequired(country, CountryMaxLength, nameof(country));
        Phone = ValidateRequired(phone, PhoneMaxLength, nameof(phone));
    }

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
}
