namespace Bymed.Domain.Entities;

public sealed class MarketingCampaignRecipient
{
    public const int InstitutionNameMaxLength = 250;
    public const int EmailMaxLength = 320;
    public const int NormalizedEmailMaxLength = 320;
    public const int ErrorMessageMaxLength = 2000;

    public Guid Id { get; set; }
    public Guid MarketingCampaignId { get; set; }
    public MarketingCampaign? MarketingCampaign { get; set; }
    public Guid ClientId { get; set; }
    public Client? Client { get; set; }
    public string InstitutionName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public MarketingRecipientEmailSource EmailSource { get; set; }
    public MarketingCampaignRecipientStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? SentAtUtc { get; set; }
}
