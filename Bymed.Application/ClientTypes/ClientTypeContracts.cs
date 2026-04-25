namespace Bymed.Application.ClientTypes;

public sealed record ClientTypeDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
}

public sealed record CreateClientTypeRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
}

public sealed record UpdateClientTypeRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
}
