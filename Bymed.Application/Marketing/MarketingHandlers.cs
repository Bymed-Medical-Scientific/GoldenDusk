using System.IO;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Options;

namespace Bymed.Application.Marketing;

public sealed class CreateMarketingCampaignCommandHandler
    : IRequestHandler<CreateMarketingCampaignCommand, Result<MarketingCampaignDetailDto>>
{
    private readonly IMarketingCampaignRepository _campaigns;
    private readonly IClientTypeRepository _clientTypes;
    private readonly IUnitOfWork _unitOfWork;

    public CreateMarketingCampaignCommandHandler(
        IMarketingCampaignRepository campaigns,
        IClientTypeRepository clientTypes,
        IUnitOfWork unitOfWork)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
        _clientTypes = clientTypes ?? throw new ArgumentNullException(nameof(clientTypes));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<MarketingCampaignDetailDto>> Handle(
        CreateMarketingCampaignCommand request,
        CancellationToken cancellationToken)
    {
        var typeIds = request.ClientTypeIds.Distinct().ToList();
        if (typeIds.Count == 0)
            return Result<MarketingCampaignDetailDto>.Failure("Select at least one client type.");

        var found = await _clientTypes.CountByIdsAsync(typeIds, cancellationToken).ConfigureAwait(false);
        if (found != typeIds.Count)
            return Result<MarketingCampaignDetailDto>.Failure("One or more client types were not found.");

        var campaign = new MarketingCampaign
        {
            Id = Guid.NewGuid(),
            Status = MarketingCampaignStatus.Draft,
            Subject = request.Subject.Trim(),
            HtmlBody = string.IsNullOrWhiteSpace(request.HtmlBody) ? null : request.HtmlBody.Trim(),
            IncludeInstitutionEmails = request.IncludeInstitutionEmails,
            IncludeContactPerson1Email = request.IncludeContactPerson1Email,
            IncludeContactPerson2Email = request.IncludeContactPerson2Email,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = request.CreatedByUserId
        };

        foreach (var tid in typeIds)
        {
            campaign.ClientTypes.Add(new MarketingCampaignClientType
            {
                MarketingCampaignId = campaign.Id,
                ClientTypeId = tid
            });
        }

        _campaigns.Add(campaign);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<MarketingCampaignDetailDto>.Success(ToDetailDto(campaign));
    }

    private static MarketingCampaignDetailDto ToDetailDto(MarketingCampaign c) =>
        new(
            c.Id,
            c.Status,
            c.Subject,
            c.HtmlBody,
            c.ClientTypes.Select(x => x.ClientTypeId).ToList(),
            c.IncludeInstitutionEmails,
            c.IncludeContactPerson1Email,
            c.IncludeContactPerson2Email,
            c.CreatedAtUtc,
            c.Attachments.Select(a => new MarketingCampaignAttachmentDto(a.Id, a.FileName, a.ContentType, a.SizeBytes)).ToList());
}

public sealed class AddMarketingCampaignAttachmentsCommandHandler
    : IRequestHandler<AddMarketingCampaignAttachmentsCommand, Result>
{
    private readonly IMarketingCampaignRepository _campaigns;
    private readonly IFileStorageService _files;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMarketingCampaignMutationLock _campaignMutationLock;
    private readonly MarketingOptions _options;

    public AddMarketingCampaignAttachmentsCommandHandler(
        IMarketingCampaignRepository campaigns,
        IFileStorageService files,
        IUnitOfWork unitOfWork,
        IMarketingCampaignMutationLock campaignMutationLock,
        IOptions<MarketingOptions> options)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
        _files = files ?? throw new ArgumentNullException(nameof(files));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _campaignMutationLock = campaignMutationLock ?? throw new ArgumentNullException(nameof(campaignMutationLock));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<Result> Handle(AddMarketingCampaignAttachmentsCommand request, CancellationToken cancellationToken)
    {
        await using var session = await _campaignMutationLock.BeginAsync(request.CampaignId, cancellationToken).ConfigureAwait(false);
        var result = await HandleCoreAsync(request, cancellationToken).ConfigureAwait(false);
        if (result.IsSuccess)
            await session.CommitAsync(cancellationToken).ConfigureAwait(false);
        return result;
    }

    private async Task<Result> HandleCoreAsync(AddMarketingCampaignAttachmentsCommand request, CancellationToken cancellationToken)
    {
        var campaign = await _campaigns.GetByIdAsync(request.CampaignId, track: true, cancellationToken).ConfigureAwait(false);
        if (campaign is null)
            return Result.Failure("Campaign not found.");
        if (campaign.Status != MarketingCampaignStatus.Draft)
            return Result.Failure("Attachments can only be added while the campaign is a draft.");

        if (request.Files.Count == 0)
            return Result.Failure("No files were uploaded.");

        if (campaign.Attachments.Count + request.Files.Count > _options.MaxAttachmentsPerCampaign)
            return Result.Failure($"A campaign cannot have more than {_options.MaxAttachmentsPerCampaign} attachments.");

        var totalBytes = campaign.Attachments.Sum(a => a.SizeBytes) + request.Files.Sum(f => (long)f.Content.Length);
        if (totalBytes > _options.MaxTotalAttachmentBytesPerCampaign)
            return Result.Failure("Total attachment size for this campaign would exceed the configured limit.");

        foreach (var file in request.Files)
        {
            await using var ms = new MemoryStream(file.Content, writable: false);
            var stored = await _files
                .SaveMarketingCampaignAttachmentAsync(
                    campaign.Id,
                    ms,
                    file.FileName,
                    file.ContentType,
                    _options.MaxAttachmentBytesPerFile,
                    cancellationToken)
                .ConfigureAwait(false);

            if (!stored.IsSuccess || stored.Value is null)
                return Result.Failure(stored.Error ?? "Failed to store attachment.");

            campaign.Attachments.Add(new MarketingCampaignAttachment
            {
                Id = Guid.NewGuid(),
                MarketingCampaignId = campaign.Id,
                FileName = Path.GetFileName(file.FileName).Trim(),
                ContentType = stored.Value.ContentType,
                StorageRelativePath = stored.Value.RelativePath,
                SizeBytes = stored.Value.SizeBytes
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed class StartMarketingCampaignCommandHandler : IRequestHandler<StartMarketingCampaignCommand, Result<bool>>
{
    private enum StartCampaignOutcome
    {
        Failed,
        AlreadyRunningOrDone,
        StartedNew
    }

    private readonly IMarketingCampaignRepository _campaigns;
    private readonly IClientRepository _clients;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMarketingCampaignMutationLock _campaignMutationLock;
    private readonly IMarketingCampaignJobQueue _queue;
    private readonly MarketingOptions _marketingOptions;

    public StartMarketingCampaignCommandHandler(
        IMarketingCampaignRepository campaigns,
        IClientRepository clients,
        IUnitOfWork unitOfWork,
        IMarketingCampaignMutationLock campaignMutationLock,
        IMarketingCampaignJobQueue queue,
        IOptions<MarketingOptions> marketingOptions)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
        _clients = clients ?? throw new ArgumentNullException(nameof(clients));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _campaignMutationLock = campaignMutationLock ?? throw new ArgumentNullException(nameof(campaignMutationLock));
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _marketingOptions = marketingOptions?.Value ?? throw new ArgumentNullException(nameof(marketingOptions));
    }

    public async Task<Result<bool>> Handle(StartMarketingCampaignCommand request, CancellationToken cancellationToken)
    {
        await using var session = await _campaignMutationLock.BeginAsync(request.CampaignId, cancellationToken).ConfigureAwait(false);
        var result = await HandleCoreAsync(request, cancellationToken).ConfigureAwait(false);
        if (result.Outcome == StartCampaignOutcome.Failed)
            return Result<bool>.Failure(result.Error ?? "Could not start campaign.");

        if (result.Outcome == StartCampaignOutcome.AlreadyRunningOrDone)
            return Result<bool>.Success(false);

        await session.CommitAsync(cancellationToken).ConfigureAwait(false);
        // Enqueue only after commit so Hangfire sees persisted recipients and Sending status.
        _queue.EnqueueSendNextBatch(request.CampaignId);
        return Result<bool>.Success(true);
    }

    private async Task<(StartCampaignOutcome Outcome, string? Error)> HandleCoreAsync(
        StartMarketingCampaignCommand request,
        CancellationToken cancellationToken)
    {
        var campaign = await _campaigns.GetByIdAsync(request.CampaignId, track: true, cancellationToken).ConfigureAwait(false);
        if (campaign is null)
            return (StartCampaignOutcome.Failed, "Campaign not found.");

        if (campaign.Status != MarketingCampaignStatus.Draft)
        {
            if (campaign.Status == MarketingCampaignStatus.Completed)
                return (StartCampaignOutcome.AlreadyRunningOrDone, null);

            if (campaign.Status == MarketingCampaignStatus.Sending)
            {
                var total = await _campaigns.CountRecipientsAsync(campaign.Id, cancellationToken).ConfigureAwait(false);
                if (total > 0)
                    return (StartCampaignOutcome.AlreadyRunningOrDone, null);
                return (StartCampaignOutcome.Failed, "This campaign cannot be started (no recipient rows). Create a new draft or contact support.");
            }

            if (campaign.Status == MarketingCampaignStatus.Failed)
                return (StartCampaignOutcome.Failed, "This campaign already failed. Create a new draft to send again.");

            return (StartCampaignOutcome.Failed, "Only draft campaigns can be started.");
        }

        if (!campaign.IncludeInstitutionEmails && !campaign.IncludeContactPerson1Email && !campaign.IncludeContactPerson2Email)
            return (StartCampaignOutcome.Failed, "Select at least one recipient email option.");

        var typeIds = campaign.ClientTypes.Select(x => x.ClientTypeId).ToList();
        if (typeIds.Count == 0)
            return (StartCampaignOutcome.Failed, "The campaign has no client types.");

        await _campaigns.RemoveRecipientsForCampaignAsync(campaign.Id, cancellationToken).ConfigureAwait(false);

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var recipients = new List<MarketingCampaignRecipient>();
        var skip = 0;
        while (true)
        {
            var page = await _clients
                .GetClientMarketingProjectionsPageAsync(typeIds, skip, _marketingOptions.ClientExpansionPageSize, cancellationToken)
                .ConfigureAwait(false);
            if (page.Count == 0)
                break;

            foreach (var row in page)
            {
                MarketingRecipientExpansion.CollectRecipients(
                    row,
                    campaign.Id,
                    campaign.IncludeInstitutionEmails,
                    campaign.IncludeContactPerson1Email,
                    campaign.IncludeContactPerson2Email,
                    seen,
                    recipients);
            }

            skip += page.Count;
        }

        if (recipients.Count == 0)
            return (StartCampaignOutcome.Failed, "No valid recipient email addresses were found for the selected types and options.");

        campaign.Status = MarketingCampaignStatus.Sending;
        campaign.StartedAtUtc = DateTime.UtcNow;
        campaign.LastError = null;
        _campaigns.AddRecipients(recipients);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return (StartCampaignOutcome.StartedNew, null);
    }
}

public sealed class GetMarketingCampaignPreviewQueryHandler
    : IRequestHandler<GetMarketingCampaignPreviewQuery, Result<MarketingCampaignPreviewDto>>
{
    private readonly IMarketingCampaignRepository _campaigns;
    private readonly IClientRepository _clients;
    private readonly MarketingOptions _marketingOptions;

    public GetMarketingCampaignPreviewQueryHandler(
        IMarketingCampaignRepository campaigns,
        IClientRepository clients,
        IOptions<MarketingOptions> marketingOptions)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
        _clients = clients ?? throw new ArgumentNullException(nameof(clients));
        _marketingOptions = marketingOptions?.Value ?? throw new ArgumentNullException(nameof(marketingOptions));
    }

    public async Task<Result<MarketingCampaignPreviewDto>> Handle(
        GetMarketingCampaignPreviewQuery request,
        CancellationToken cancellationToken)
    {
        var campaign = await _campaigns.GetByIdAsync(request.CampaignId, track: false, cancellationToken).ConfigureAwait(false);
        if (campaign is null)
            return Result<MarketingCampaignPreviewDto>.Failure("Campaign not found.");
        if (campaign.Status != MarketingCampaignStatus.Draft)
            return Result<MarketingCampaignPreviewDto>.Failure("Preview is only available for draft campaigns.");

        var typeIds = campaign.ClientTypes.Select(x => x.ClientTypeId).ToList();
        var clientCount = await _clients.CountClientsByClientTypeIdsAsync(typeIds, cancellationToken).ConfigureAwait(false);

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var recipients = new List<MarketingCampaignRecipient>();
        var skip = 0;
        while (true)
        {
            var page = await _clients
                .GetClientMarketingProjectionsPageAsync(typeIds, skip, _marketingOptions.ClientExpansionPageSize, cancellationToken)
                .ConfigureAwait(false);
            if (page.Count == 0)
                break;

            foreach (var row in page)
            {
                MarketingRecipientExpansion.CollectRecipients(
                    row,
                    campaign.Id,
                    campaign.IncludeInstitutionEmails,
                    campaign.IncludeContactPerson1Email,
                    campaign.IncludeContactPerson2Email,
                    seen,
                    recipients);
            }

            skip += page.Count;
        }

        var sample = recipients
            .Take(20)
            .Select(r => new MarketingCampaignRecipientPreviewRowDto(r.InstitutionName, r.Email, r.EmailSource))
            .ToList();

        return Result<MarketingCampaignPreviewDto>.Success(
            new MarketingCampaignPreviewDto(clientCount, recipients.Count, sample));
    }
}

public sealed class GetMarketingCampaignStatusQueryHandler
    : IRequestHandler<GetMarketingCampaignStatusQuery, Result<MarketingCampaignStatusDto>>
{
    private readonly IMarketingCampaignRepository _campaigns;

    public GetMarketingCampaignStatusQueryHandler(IMarketingCampaignRepository campaigns)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
    }

    public async Task<Result<MarketingCampaignStatusDto>> Handle(
        GetMarketingCampaignStatusQuery request,
        CancellationToken cancellationToken)
    {
        var campaign = await _campaigns.GetByIdAsync(request.CampaignId, track: false, cancellationToken).ConfigureAwait(false);
        if (campaign is null)
            return Result<MarketingCampaignStatusDto>.Failure("Campaign not found.");

        var total = await _campaigns.CountRecipientsAsync(campaign.Id, cancellationToken).ConfigureAwait(false);
        var sent = await _campaigns.CountSentRecipientsAsync(campaign.Id, cancellationToken).ConfigureAwait(false);
        var failed = await _campaigns.CountFailedRecipientsAsync(campaign.Id, cancellationToken).ConfigureAwait(false);
        var pending = await _campaigns.CountPendingRecipientsAsync(campaign.Id, cancellationToken).ConfigureAwait(false);

        return Result<MarketingCampaignStatusDto>.Success(
            new MarketingCampaignStatusDto(
                campaign.Id,
                campaign.Status,
                campaign.Subject,
                total,
                sent,
                failed,
                pending,
                campaign.LastError,
                campaign.CreatedAtUtc,
                campaign.StartedAtUtc,
                campaign.CompletedAtUtc));
    }
}

public sealed class ListMarketingCampaignsQueryHandler
    : IRequestHandler<ListMarketingCampaignsQuery, IReadOnlyList<MarketingCampaignListItemDto>>
{
    private readonly IMarketingCampaignRepository _campaigns;

    public ListMarketingCampaignsQueryHandler(IMarketingCampaignRepository campaigns)
    {
        _campaigns = campaigns ?? throw new ArgumentNullException(nameof(campaigns));
    }

    public async Task<IReadOnlyList<MarketingCampaignListItemDto>> Handle(
        ListMarketingCampaignsQuery request,
        CancellationToken cancellationToken)
    {
        var rows = await _campaigns.ListRecentAsync(request.Take, cancellationToken).ConfigureAwait(false);
        return rows.Select(c => new MarketingCampaignListItemDto(c.Id, c.Status, c.Subject, c.CreatedAtUtc)).ToList();
    }
}
