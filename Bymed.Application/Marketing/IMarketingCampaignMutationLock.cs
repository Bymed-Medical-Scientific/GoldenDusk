namespace Bymed.Application.Marketing;

/// <summary>
/// Begins a DB transaction scoped to one marketing campaign and takes a PostgreSQL transaction advisory lock
/// so attachment uploads and "start send" cannot interleave on the same campaign row.
/// </summary>
public interface IMarketingCampaignMutationLock
{
    Task<IMarketingCampaignWriteSession> BeginAsync(Guid campaignId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Call <see cref="CommitAsync"/> after a successful <c>SaveChanges</c>; otherwise dispose rolls the transaction back.
/// </summary>
public interface IMarketingCampaignWriteSession : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
}
