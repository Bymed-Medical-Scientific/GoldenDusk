using Bymed.Application.Marketing;
using Hangfire;

namespace Bymed.Infrastructure.Email;

public sealed class MarketingCampaignJobQueue : IMarketingCampaignJobQueue
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public MarketingCampaignJobQueue(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient ?? throw new ArgumentNullException(nameof(backgroundJobClient));
    }

    public void EnqueueSendNextBatch(Guid marketingCampaignId)
    {
        _backgroundJobClient.Enqueue<MarketingCampaignJobRunner>(runner =>
            runner.ProcessNextBatchAsync(marketingCampaignId));
    }
}
