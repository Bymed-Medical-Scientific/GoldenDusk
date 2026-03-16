namespace Bymed.Application.Products;

public sealed record CreateProductRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public required Guid CategoryId { get; init; }
    public decimal Price { get; init; }
    public int InventoryCount { get; init; }
    public int LowStockThreshold { get; init; }
    public string? Sku { get; init; }
    public string? Currency { get; init; }
    public IReadOnlyDictionary<string, string>? Specifications { get; init; }
}
