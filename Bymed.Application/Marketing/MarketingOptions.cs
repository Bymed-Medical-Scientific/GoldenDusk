namespace Bymed.Application.Marketing;

public sealed class MarketingOptions
{
    public const string SectionName = "Marketing";

    /// <summary>Recipients processed per Hangfire job iteration.</summary>
    public int SendBatchSize { get; set; } = 25;

    public int MaxAttachmentsPerCampaign { get; set; } = 5;

    public long MaxAttachmentBytesPerFile { get; set; } = 10L * 1024 * 1024;

    public long MaxTotalAttachmentBytesPerCampaign { get; set; } = 25L * 1024 * 1024;

    /// <summary>Clients loaded per page when expanding recipients.</summary>
    public int ClientExpansionPageSize { get; set; } = 500;
}
