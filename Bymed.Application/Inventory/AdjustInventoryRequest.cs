namespace Bymed.Application.Inventory;

public sealed record AdjustInventoryRequest
{
    public int Adjustment { get; init; }
    public required string Reason { get; init; }
}
