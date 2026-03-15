namespace Bymed.Domain.Primitives;

public abstract class FullAuditedEntity : AuditedEntity
{
    public DateTime? LastModificationTime { get; protected set; }
    public Guid? LastModifierUserId { get; protected set; }
    public Account? LastModifier { get; protected set; }

    protected FullAuditedEntity()
    {
    }

    protected FullAuditedEntity(Guid id) : base(id)
    {
    }

    public void PrepareEntityForUpdate(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        LastModifierUserId = account.Id;
        LastModificationTime = DateTime.UtcNow;
    }

    public void PrepareForCreateAndUpdate(Account account)
    {
        PrepareEntityForCreate(account);
        PrepareEntityForUpdate(account);
    }
}
