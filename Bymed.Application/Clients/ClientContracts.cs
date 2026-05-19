namespace Bymed.Application.Clients;

public sealed record ClientContactPersonDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Faculty { get; init; }
}

public sealed record ClientContactPersonRequest
{
    public required string Name { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Faculty { get; init; }
}

public sealed record ClientDto
{
    public required Guid Id { get; init; }
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Telephone { get; init; }
    public required Guid ClientTypeId { get; init; }
    public required string ClientTypeName { get; init; }
    public required IReadOnlyList<ClientContactPersonDto> ContactPersons { get; init; }
}

public sealed record CreateClientRequest
{
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public required Guid ClientTypeId { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Telephone { get; init; }
    public IReadOnlyList<ClientContactPersonRequest>? ContactPersons { get; init; }
}

public sealed record UpdateClientRequest
{
    public required string InstitutionName { get; init; }
    public required string Address { get; init; }
    public required Guid ClientTypeId { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Telephone { get; init; }
    public IReadOnlyList<ClientContactPersonRequest>? ContactPersons { get; init; }
}
