namespace Bymed.Application.Products;

public sealed record ImportProductsResultDto
{
    public int ImportedCount { get; init; }
    public int UpdatedCount { get; init; }
    public int FailedCount { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];
}
