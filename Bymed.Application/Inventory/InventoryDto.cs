namespace Bymed.Application.Inventory;

public sealed record InventoryDto
{
    public required Guid ProductId { get; init; }
    public required string ProductName { get; init; }
    public string? Sku { get; init; }
    public int InventoryCount { get; init; }
    public int LowStockThreshold { get; init; }
    public bool IsAvailable { get; init; }
    public bool IsLowStock => InventoryCount <= LowStockThreshold;
}
