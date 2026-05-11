using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IMarketingCampaignRepository
{
    Task<MarketingCampaign?> GetByIdAsync(Guid id, bool track, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MarketingCampaign>> ListRecentAsync(int take, CancellationToken cancellationToken = default);

    void Add(MarketingCampaign campaign);

    void AddRecipients(IEnumerable<MarketingCampaignRecipient> recipients);

    Task<IReadOnlyList<MarketingCampaignRecipient>> GetPendingRecipientsAsync(
        Guid campaignId,
        int take,
        CancellationToken cancellationToken = default);

    Task<int> CountPendingRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default);

    Task<int> CountRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default);

    Task<int> CountSentRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default);

    Task<int> CountFailedRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default);

    Task RemoveRecipientsForCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default);
}
