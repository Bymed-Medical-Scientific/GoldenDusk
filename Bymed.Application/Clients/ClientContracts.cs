namespace Bymed.Application.Clients;

public sealed record ClientDto
{
    public required Guid Id { get; init; }
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public string? Email1 { get; init; }
    public string? Email2 { get; init; }
    public string? Email3 { get; init; }
    public string? PhoneNumber1 { get; init; }
    public string? PhoneNumber2 { get; init; }
    public string? PhoneNumber3 { get; init; }
    public string? TelephoneNumber1 { get; init; }
    public string? TelephoneNumber2 { get; init; }
    public string? TelephoneNumber3 { get; init; }
    public string? ContactPerson1Name { get; init; }
    public string? ContactPerson1Email { get; init; }
    public string? ContactPerson1Telephone { get; init; }
    public string? ContactPerson2Name { get; init; }
    public string? ContactPerson2Email { get; init; }
    public string? ContactPerson2Telephone { get; init; }
    public required Guid ClientTypeId { get; init; }
    public required string ClientTypeName { get; init; }
}

public sealed record CreateClientRequest
{
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public required Guid ClientTypeId { get; init; }
    public string? Email1 { get; init; }
    public string? Email2 { get; init; }
    public string? Email3 { get; init; }
    public string? PhoneNumber1 { get; init; }
    public string? PhoneNumber2 { get; init; }
    public string? PhoneNumber3 { get; init; }
    public string? TelephoneNumber1 { get; init; }
    public string? TelephoneNumber2 { get; init; }
    public string? TelephoneNumber3 { get; init; }
    public string? ContactPerson1Name { get; init; }
    public string? ContactPerson1Email { get; init; }
    public string? ContactPerson1Telephone { get; init; }
    public string? ContactPerson2Name { get; init; }
    public string? ContactPerson2Email { get; init; }
    public string? ContactPerson2Telephone { get; init; }
}

public sealed record UpdateClientRequest
{
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public required Guid ClientTypeId { get; init; }
    public string? Email1 { get; init; }
    public string? Email2 { get; init; }
    public string? Email3 { get; init; }
    public string? PhoneNumber1 { get; init; }
    public string? PhoneNumber2 { get; init; }
    public string? PhoneNumber3 { get; init; }
    public string? TelephoneNumber1 { get; init; }
    public string? TelephoneNumber2 { get; init; }
    public string? TelephoneNumber3 { get; init; }
    public string? ContactPerson1Name { get; init; }
    public string? ContactPerson1Email { get; init; }
    public string? ContactPerson1Telephone { get; init; }
    public string? ContactPerson2Name { get; init; }
    public string? ContactPerson2Email { get; init; }
    public string? ContactPerson2Telephone { get; init; }
}
