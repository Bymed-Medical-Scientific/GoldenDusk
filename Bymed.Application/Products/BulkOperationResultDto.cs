namespace Bymed.Application.Products;

public sealed record BulkOperationResultDto
{
    public int RequestedCount { get; init; }
    public int ProcessedCount { get; init; }
    public int NotFoundCount { get; init; }
}
