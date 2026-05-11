namespace Bymed.Application.Marketing;

public interface IMarketingCampaignJobQueue
{
    void EnqueueSendNextBatch(Guid marketingCampaignId);
}
