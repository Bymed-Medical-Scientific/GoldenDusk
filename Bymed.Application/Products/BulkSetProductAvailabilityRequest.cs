namespace Bymed.Application.Products;

public sealed record BulkSetProductAvailabilityRequest
{
    public required IReadOnlyCollection<Guid> ProductIds { get; init; }
    public required bool IsAvailable { get; init; }
}
