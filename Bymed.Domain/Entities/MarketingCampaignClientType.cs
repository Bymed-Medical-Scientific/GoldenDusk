namespace Bymed.Domain.Entities;

public sealed class MarketingCampaignClientType
{
    public Guid MarketingCampaignId { get; set; }
    public MarketingCampaign? MarketingCampaign { get; set; }
    public Guid ClientTypeId { get; set; }
    public ClientType? ClientType { get; set; }
}
