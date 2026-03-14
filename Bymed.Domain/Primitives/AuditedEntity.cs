namespace Bymed.Domain.Primitives;

/// <summary>
/// Entity with creation and soft-delete audit fields.
/// </summary>
public abstract class AuditedEntity : BaseEntity
{
    public DateTime CreationTime { get; protected set; }
    public Guid? CreatorId { get; protected set; }
    public Account? Creator { get; protected set; }

    public bool IsDeleted { get; protected set; }
    public DateTime? DeletionTime { get; protected set; }
    public Guid? DeleterId { get; protected set; }
    public Account? Deleter { get; protected set; }

    protected AuditedEntity()
    {
    }

    protected AuditedEntity(Guid id) : base(id)
    {
    }

    /// <summary>
    /// Marks the entity as deleted and sets deleter and deletion time.
    /// </summary>
    public void PrepareEntityForDelete(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        IsDeleted = true;
        DeleterId = account.Id;
        DeletionTime = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets creator and creation time for a new entity.
    /// </summary>
    public void PrepareEntityForCreate(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        CreatorId = account.Id;
        CreationTime = DateTime.UtcNow;
    }
}
