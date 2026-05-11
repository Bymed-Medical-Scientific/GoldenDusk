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

public sealed record StartMarketingCampaignCommand(Guid CampaignId) : IRequest<Result>;

public sealed record GetMarketingCampaignPreviewQuery(Guid CampaignId) : IRequest<Result<MarketingCampaignPreviewDto>>;

public sealed record GetMarketingCampaignStatusQuery(Guid CampaignId) : IRequest<Result<MarketingCampaignStatusDto>>;

public sealed record ListMarketingCampaignsQuery(int Take = 30) : IRequest<IReadOnlyList<MarketingCampaignListItemDto>>;
