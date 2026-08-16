namespace Bymed.Application.Products;

public sealed record CreateProductRequest
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required Guid CategoryId { get; init; }
    public decimal Price { get; init; }
    public string? Brand { get; init; }
    public string? ClientType { get; init; }
    public string? Currency { get; init; }
    public IReadOnlyDictionary<string, string>? Specifications { get; init; }
}
