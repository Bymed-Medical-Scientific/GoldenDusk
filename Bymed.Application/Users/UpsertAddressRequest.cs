namespace Bymed.Application.Users;

public sealed record UpsertAddressRequest(
    string Name,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    string Phone,
    bool IsDefault);
