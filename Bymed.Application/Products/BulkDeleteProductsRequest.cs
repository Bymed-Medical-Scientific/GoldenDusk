namespace Bymed.Application.Products;

public sealed record BulkDeleteProductsRequest
{
    public required IReadOnlyCollection<Guid> ProductIds { get; init; }
}
