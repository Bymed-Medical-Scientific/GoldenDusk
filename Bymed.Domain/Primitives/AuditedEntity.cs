namespace Bymed.Domain.Primitives;

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

    public void PrepareEntityForDelete(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        IsDeleted = true;
        DeleterId = account.Id;
        DeletionTime = DateTime.UtcNow;
    }

    public void PrepareEntityForCreate(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        CreatorId = account.Id;
        CreationTime = DateTime.UtcNow;
    }
}
