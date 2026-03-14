using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// Append-only log entry for a product inventory change (audit trail for requirement 9.5).
/// </summary>
public class InventoryLog : BaseEntity
{
    public const int ReasonMaxLength = 500;
    public const int ChangedByMaxLength = 256;

    public Guid ProductId { get; private set; }
    public int PreviousCount { get; private set; }
    public int NewCount { get; private set; }
    public int ChangeAmount { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public string ChangedBy { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    public Product Product { get; private set; } = null!;

    private InventoryLog()
    {
    }

    /// <summary>
    /// Creates a new inventory log entry. Typically created when handling InventoryChangedEvent or on direct adjustment.
    /// </summary>
    public InventoryLog(Guid productId, int previousCount, int newCount, string reason, string changedBy)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("Product Id cannot be empty.", nameof(productId));
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        ArgumentException.ThrowIfNullOrWhiteSpace(changedBy);

        var reasonTrimmed = reason.Trim();
        var changedByTrimmed = changedBy.Trim();
        if (reasonTrimmed.Length > ReasonMaxLength)
            throw new ArgumentException($"Reason must not exceed {ReasonMaxLength} characters.", nameof(reason));
        if (changedByTrimmed.Length > ChangedByMaxLength)
            throw new ArgumentException($"Changed by must not exceed {ChangedByMaxLength} characters.", nameof(changedBy));

        ProductId = productId;
        PreviousCount = previousCount;
        NewCount = newCount;
        ChangeAmount = newCount - previousCount;
        Reason = reasonTrimmed;
        ChangedBy = changedByTrimmed;
        CreatedAt = DateTime.UtcNow;
    }
}
