using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Marketing;

public sealed record CreateMarketingCampaignCommand(
    string Subject,
    string? HtmlBody,
    IReadOnlyList<Guid> ClientTypeIds,
    bool IncludeInstitutionEmails,
    bool IncludeContactPerson1Email,
    bool IncludeContactPerson2Email,
    Guid? CreatedByUserId) : IRequest<Result<MarketingCampaignDetailDto>>;

public sealed record MarketingAttachmentFile(string FileName, string ContentType, byte[] Content);

public sealed record AddMarketingCampaignAttachmentsCommand(
    Guid CampaignId,
    IReadOnlyList<MarketingAttachmentFile> Files) : IRequest<Result>;

/// <param name="CampaignId">Campaign to start.</param>
/// <summary>
/// On success, <see cref="Result{T}.Value"/> is <c>true</c> when the campaign was newly transitioned to sending (Hangfire was enqueued),
/// or <c>false</c> when it was already sending or completed (idempotent no-op).
/// </summary>
public sealed record StartMarketingCampaignCommand(Guid CampaignId) : IRequest<Result<bool>>;

public sealed record GetMarketingCampaignPreviewQuery(Guid CampaignId) : IRequest<Result<MarketingCampaignPreviewDto>>;

public sealed record GetMarketingCampaignStatusQuery(Guid CampaignId) : IRequest<Result<MarketingCampaignStatusDto>>;

public sealed record ListMarketingCampaignsQuery(int Take = 30) : IRequest<IReadOnlyList<MarketingCampaignListItemDto>>;
