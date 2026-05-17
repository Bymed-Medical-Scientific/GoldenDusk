using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IMarketingCampaignRepository
{
    Task<MarketingCampaign?> GetByIdAsync(Guid id, bool track, CancellationToken cancellationToken = default);

    /// <summary>
    /// Loads a draft campaign for attachment upload or start-send (client types only; attachments are not tracked).
    /// </summary>
    Task<MarketingCampaign?> GetByIdForMutationAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(int Count, long TotalBytes)> GetAttachmentStatsAsync(
        Guid campaignId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MarketingCampaign>> ListRecentAsync(int take, CancellationToken cancellationToken = default);

    void Add(MarketingCampaign campaign);

    void AddAttachments(IEnumerable<MarketingCampaignAttachment> attachments);

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
