namespace Bymed.Application.Inventory;

public sealed record InventoryLogDto
{
    public required Guid Id { get; init; }
    public required Guid ProductId { get; init; }
    public int PreviousCount { get; init; }
    public int NewCount { get; init; }
    public int ChangeAmount { get; init; }
    public required string Reason { get; init; }
    public required string ChangedBy { get; init; }
    public DateTime CreatedAt { get; init; }
}
