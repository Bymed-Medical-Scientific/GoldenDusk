namespace Bymed.Domain.Primitives;

/// <summary>
/// Entity with creation, modification, and soft-delete audit fields.
/// </summary>
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

    /// <summary>
    /// Sets last modifier and modification time for an update.
    /// </summary>
    public void PrepareEntityForUpdate(Account account)
    {
        ArgumentNullException.ThrowIfNull(account);
        LastModifierUserId = account.Id;
        LastModificationTime = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets both creation and last-modification audit fields (e.g. for create that also sets last modifier).
    /// </summary>
    public void PrepareForCreateAndUpdate(Account account)
    {
        PrepareEntityForCreate(account);
        PrepareEntityForUpdate(account);
    }
}
