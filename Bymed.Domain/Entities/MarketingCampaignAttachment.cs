namespace Bymed.Domain.Entities;

public sealed class MarketingCampaignAttachment
{
    public const int FileNameMaxLength = 260;
    public const int ContentTypeMaxLength = 120;
    public const int StorageRelativePathMaxLength = 500;

    public Guid Id { get; set; }
    public Guid MarketingCampaignId { get; set; }
    public MarketingCampaign? MarketingCampaign { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string StorageRelativePath { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}
