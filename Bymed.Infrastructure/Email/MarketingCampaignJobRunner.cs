using System.Net.Mail;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Files;
using Bymed.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Email;

public sealed class MarketingCampaignJobRunner
{
    private readonly ApplicationDbContext _db;
    private readonly ISmtpEmailSender _smtpEmailSender;
    private readonly IOptions<EmailOptions> _emailOptions;
    private readonly IOptions<FileStorageOptions> _fileStorageOptions;
    private readonly IOptions<Bymed.Application.Marketing.MarketingOptions> _marketingOptions;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<MarketingCampaignJobRunner> _logger;

    public MarketingCampaignJobRunner(
        ApplicationDbContext db,
        ISmtpEmailSender smtpEmailSender,
        IOptions<EmailOptions> emailOptions,
        IOptions<FileStorageOptions> fileStorageOptions,
        IOptions<Bymed.Application.Marketing.MarketingOptions> marketingOptions,
        IHostEnvironment hostEnvironment,
        IBackgroundJobClient backgroundJobClient,
        ILogger<MarketingCampaignJobRunner> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _smtpEmailSender = smtpEmailSender ?? throw new ArgumentNullException(nameof(smtpEmailSender));
        _emailOptions = emailOptions ?? throw new ArgumentNullException(nameof(emailOptions));
        _fileStorageOptions = fileStorageOptions ?? throw new ArgumentNullException(nameof(fileStorageOptions));
        _marketingOptions = marketingOptions ?? throw new ArgumentNullException(nameof(marketingOptions));
        _hostEnvironment = hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));
        _backgroundJobClient = backgroundJobClient ?? throw new ArgumentNullException(nameof(backgroundJobClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task ProcessNextBatchAsync(Guid campaignId)
    {
        var campaign = await _db.MarketingCampaigns
            .AsNoTracking()
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == campaignId)
            .ConfigureAwait(false);

        if (campaign is null)
        {
            _logger.LogWarning("Marketing campaign {CampaignId} not found; skipping batch.", campaignId);
            return;
        }

        if (campaign.Status != MarketingCampaignStatus.Sending)
            return;

        var pendingBefore = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending)
            .ConfigureAwait(false);

        if (pendingBefore == 0)
        {
            await FinalizeCampaignAfterRecipientsProcessedAsync(campaignId).ConfigureAwait(false);
            return;
        }

        var batchSize = Math.Max(1, _marketingOptions.Value.SendBatchSize);
        var batch = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .Where(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending)
            .OrderBy(r => r.Id)
            .Take(batchSize)
            .ToListAsync()
            .ConfigureAwait(false);

        if (batch.Count == 0)
        {
            await FinalizeCampaignAfterRecipientsProcessedAsync(campaignId).ConfigureAwait(false);
            return;
        }

        _logger.LogInformation(
            "Marketing campaign {CampaignId}: processing send batch of {BatchRecipientCount} message(s) ({PendingBefore} were pending, batch size cap {BatchSize}).",
            campaignId,
            batch.Count,
            pendingBefore,
            batchSize);

        var load = await LoadAttachmentPayloadsAsync(campaign.Attachments).ConfigureAwait(false);
        if (!load.Success)
        {
            _logger.LogError("Campaign {CampaignId}: {Error}", campaignId, load.Error);
            await _db.MarketingCampaigns
                .Where(c => c.Id == campaignId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Status, MarketingCampaignStatus.Failed)
                    .SetProperty(c => c.LastError, load.Error))
                .ConfigureAwait(false);
            return;
        }

        var emailOpts = _emailOptions.Value;
        var fromAddress = string.IsNullOrWhiteSpace(emailOpts.MarketingFromAddress)
            ? emailOpts.FromAddress
            : emailOpts.MarketingFromAddress.Trim();
        var fromName = string.IsNullOrWhiteSpace(emailOpts.MarketingFromName)
            ? emailOpts.FromName
            : emailOpts.MarketingFromName.Trim();

        foreach (var recipient in batch)
        {
            try
            {
                var html = MarketingEmailHtml.Build(
                    _emailOptions,
                    recipient.InstitutionName,
                    campaign.HtmlBody,
                    campaign.Subject);

                await _smtpEmailSender.SendMarketingEmailAsync(
                    recipient.Email,
                    fromAddress,
                    fromName,
                    campaign.Subject,
                    html,
                    load.Attachments!,
                    CancellationToken.None,
                    marketingCampaignId: campaignId).ConfigureAwait(false);

                var sentAt = DateTime.UtcNow;
                await _db.MarketingCampaignRecipients
                    .Where(r => r.Id == recipient.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(r => r.Status, MarketingCampaignRecipientStatus.Sent)
                        .SetProperty(r => r.SentAtUtc, sentAt)
                        .SetProperty(r => r.ErrorMessage, (string?)null))
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var msg = BuildRecipientFailureMessage(ex, MarketingCampaignRecipient.ErrorMessageMaxLength);
                _logger.LogError(ex, "Failed to send marketing email to {Email} for campaign {CampaignId}.", recipient.Email, campaignId);
                await _db.MarketingCampaignRecipients
                    .Where(r => r.Id == recipient.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(r => r.Status, MarketingCampaignRecipientStatus.Failed)
                        .SetProperty(r => r.ErrorMessage, msg))
                    .ConfigureAwait(false);
            }
        }

        var pendingAfter = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending)
            .ConfigureAwait(false);

        if (pendingAfter > 0)
        {
            _logger.LogInformation(
                "Marketing campaign {CampaignId}: {PendingAfter} recipient(s) still pending; enqueueing next batch.",
                campaignId,
                pendingAfter);
            _backgroundJobClient.Enqueue<MarketingCampaignJobRunner>(runner =>
                runner.ProcessNextBatchAsync(campaignId));
        }
        else
        {
            await FinalizeCampaignAfterRecipientsProcessedAsync(campaignId).ConfigureAwait(false);
        }
    }

    private async Task<(bool Success, string? Error, IReadOnlyList<SmtpEmailAttachment>? Attachments)> LoadAttachmentPayloadsAsync(
        IEnumerable<MarketingCampaignAttachment> attachments)
    {
        var root = _fileStorageOptions.Value.RootPath;
        if (string.IsNullOrWhiteSpace(root))
            return (false, "File storage root is not configured.", null);

        if (!Path.IsPathRooted(root))
            root = Path.GetFullPath(root, _hostEnvironment.ContentRootPath);

        var list = new List<SmtpEmailAttachment>();
        foreach (var att in attachments)
        {
            var path = Path.Combine(root, att.StorageRelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(path))
                return (false, $"Attachment file missing: {att.FileName}.", null);

            var bytes = await File.ReadAllBytesAsync(path).ConfigureAwait(false);
            list.Add(new SmtpEmailAttachment(att.FileName, att.ContentType, bytes));
        }

        return (true, null, list);
    }

    /// <summary>
    /// When no recipients are left in Pending, either mark the campaign Completed (at least one send succeeded)
    /// or Failed (zero sends, or no recipient rows). Re-enqueues if counts look inconsistent (race safety).
    /// </summary>
    private async Task FinalizeCampaignAfterRecipientsProcessedAsync(Guid campaignId)
    {
        var finishedAt = DateTime.UtcNow;

        var total = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId)
            .ConfigureAwait(false);
        var pending = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending)
            .ConfigureAwait(false);
        var sent = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Sent)
            .ConfigureAwait(false);
        var failed = await _db.MarketingCampaignRecipients
            .AsNoTracking()
            .CountAsync(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Failed)
            .ConfigureAwait(false);

        if (pending > 0)
        {
            _logger.LogWarning(
                "Marketing campaign {CampaignId}: finalize called but {Pending} recipient(s) still pending; scheduling another batch.",
                campaignId,
                pending);
            _backgroundJobClient.Enqueue<MarketingCampaignJobRunner>(runner =>
                runner.ProcessNextBatchAsync(campaignId));
            return;
        }

        if (total == 0)
        {
            var rowsNoRecipients = await _db.MarketingCampaigns
                .Where(c => c.Id == campaignId && c.Status == MarketingCampaignStatus.Sending)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Status, MarketingCampaignStatus.Failed)
                    .SetProperty(c => c.CompletedAtUtc, finishedAt)
                    .SetProperty(c => c.LastError, "No recipient rows exist for this campaign; nothing was sent."))
                .ConfigureAwait(false);
            if (rowsNoRecipients > 0)
            {
                _logger.LogWarning(
                    "Marketing campaign {CampaignId}: marked Failed (no recipient rows) at {FinishedAtUtc:o}.",
                    campaignId,
                    finishedAt);
            }

            return;
        }

        if (sent == 0 && failed > 0)
        {
            var summary =
                $"No marketing emails were accepted by SMTP for any recipient ({failed} failed). Check Email/SMTP configuration, marketing From address, and API logs.";
            var rowsAllFailed = await _db.MarketingCampaigns
                .Where(c => c.Id == campaignId && c.Status == MarketingCampaignStatus.Sending)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Status, MarketingCampaignStatus.Failed)
                    .SetProperty(c => c.CompletedAtUtc, finishedAt)
                    .SetProperty(c => c.LastError, summary))
                .ConfigureAwait(false);
            if (rowsAllFailed > 0)
            {
                _logger.LogWarning(
                    "Marketing campaign {CampaignId}: marked Failed (0 sent, {Failed} failed) at {FinishedAtUtc:o}.",
                    campaignId,
                    failed,
                    finishedAt);
            }

            return;
        }

        string? lastError = null;
        if (sent > 0 && failed > 0)
        {
            lastError = $"{failed} of {total} recipient(s) failed SMTP send; {sent} were accepted by SMTP. Check failed rows and spam folders.";
        }

        var updated = await _db.MarketingCampaigns
            .Where(c => c.Id == campaignId && c.Status == MarketingCampaignStatus.Sending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.Status, MarketingCampaignStatus.Completed)
                .SetProperty(c => c.CompletedAtUtc, finishedAt)
                .SetProperty(c => c.LastError, lastError))
            .ConfigureAwait(false);

        if (updated > 0)
        {
            _logger.LogInformation(
                "Marketing campaign {CampaignId}: recipients finished (sent {Sent}, failed {Failed}, total {Total}); campaign marked Completed at {FinishedAtUtc:o}.",
                campaignId,
                sent,
                failed,
                total,
                finishedAt);
        }
    }

    /// <summary>
    /// <see cref="SmtpException"/> often only exposes "Failure sending mail." on <see cref="Exception.Message"/>;
    /// the actionable reason is usually in <see cref="SmtpException.StatusCode"/> and inner exceptions.
    /// </summary>
    private static string BuildRecipientFailureMessage(Exception ex, int maxLength)
    {
        var parts = new List<string>(8);

        if (ex is SmtpException smtp)
        {
            parts.Add($"{smtp.Message.Trim()} (SMTP StatusCode: {smtp.StatusCode})");
        }
        else
        {
            parts.Add(ex.Message.Trim());
        }

        for (var inner = ex.InnerException; inner is not null; inner = inner.InnerException)
        {
            var t = inner.Message.Trim();
            if (t.Length > 0)
                parts.Add(t);
        }

        var text = string.Join(" | ", parts);
        if (text.Length > maxLength)
            return text[..maxLength];

        return text;
    }
}
