namespace Bymed.Application.Marketing;

/// <summary>
/// Begins a DB transaction scoped to one marketing campaign and takes a row-level lock
/// (<c>SELECT … FOR UPDATE</c> on <c>MarketingCampaigns</c>) so attachment uploads and "start send" cannot interleave
/// on the same campaign.
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
