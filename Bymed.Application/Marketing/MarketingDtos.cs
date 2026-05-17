using Bymed.Domain.Entities;

namespace Bymed.Application.Marketing;

public sealed record MarketingCampaignDetailDto(
    Guid Id,
    MarketingCampaignStatus Status,
    string Subject,
    string? HtmlBody,
    IReadOnlyList<Guid> ClientTypeIds,
    bool IncludeInstitutionEmails,
    bool IncludeContactPerson1Email,
    bool IncludeContactPerson2Email,
    DateTime CreatedAtUtc,
    IReadOnlyList<MarketingCampaignAttachmentDto> Attachments);

public sealed record MarketingCampaignAttachmentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes);

public sealed record MarketingCampaignPreviewDto(
    int MatchingClientCount,
    int RecipientCount,
    IReadOnlyList<MarketingCampaignRecipientPreviewRowDto> SampleRecipients);

public sealed record MarketingCampaignRecipientPreviewRowDto(
    string InstitutionName,
    string Email,
    MarketingRecipientEmailSource Source);

public sealed record MarketingCampaignStatusDto(
    Guid Id,
    MarketingCampaignStatus Status,
    string Subject,
    int TotalRecipients,
    int SentCount,
    int FailedCount,
    int PendingCount,
    string? LastError,
    DateTime CreatedAtUtc,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc);

public sealed record MarketingCampaignListItemDto(
    Guid Id,
    MarketingCampaignStatus Status,
    string Subject,
    DateTime CreatedAtUtc);
