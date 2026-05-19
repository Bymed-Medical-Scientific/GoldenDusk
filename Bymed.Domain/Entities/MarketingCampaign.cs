namespace Bymed.Domain.Entities;

public sealed class MarketingCampaign
{
    public const int SubjectMaxLength = 200;
    public const int HtmlBodyMaxLength = 100_000;

    public Guid Id { get; set; }
    public MarketingCampaignStatus Status { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public bool IncludeInstitutionEmails { get; set; }
    public bool IncludeContactPersonEmails { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? LastError { get; set; }

    public ICollection<MarketingCampaignClientType> ClientTypes { get; set; } = new List<MarketingCampaignClientType>();
    public ICollection<MarketingCampaignAttachment> Attachments { get; set; } = new List<MarketingCampaignAttachment>();
    public ICollection<MarketingCampaignRecipient> Recipients { get; set; } = new List<MarketingCampaignRecipient>();
}
