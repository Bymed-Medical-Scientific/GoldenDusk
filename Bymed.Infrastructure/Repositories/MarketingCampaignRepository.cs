using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class MarketingCampaignRepository : IMarketingCampaignRepository
{
    private readonly ApplicationDbContext _context;

    public MarketingCampaignRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<MarketingCampaign?> GetByIdAsync(Guid id, bool track, CancellationToken cancellationToken = default)
    {
        var query = _context.MarketingCampaigns
            .Include(c => c.ClientTypes)
            .Include(c => c.Attachments)
            .AsQueryable();

        if (!track)
            query = query.AsNoTracking();

        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<MarketingCampaign>> ListRecentAsync(int take, CancellationToken cancellationToken = default)
    {
        return await _context.MarketingCampaigns
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(MarketingCampaign campaign)
    {
        ArgumentNullException.ThrowIfNull(campaign);
        _context.MarketingCampaigns.Add(campaign);
    }

    public void AddRecipients(IEnumerable<MarketingCampaignRecipient> recipients)
    {
        ArgumentNullException.ThrowIfNull(recipients);
        _context.MarketingCampaignRecipients.AddRange(recipients);
    }

    public async Task<IReadOnlyList<MarketingCampaignRecipient>> GetPendingRecipientsAsync(
        Guid campaignId,
        int take,
        CancellationToken cancellationToken = default)
    {
        return await _context.MarketingCampaignRecipients
            .AsNoTracking()
            .Where(r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending)
            .OrderBy(r => r.Id)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<int> CountPendingRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default) =>
        _context.MarketingCampaignRecipients.CountAsync(
            r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Pending,
            cancellationToken);

    public Task<int> CountRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default) =>
        _context.MarketingCampaignRecipients.CountAsync(r => r.MarketingCampaignId == campaignId, cancellationToken);

    public Task<int> CountSentRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default) =>
        _context.MarketingCampaignRecipients.CountAsync(
            r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Sent,
            cancellationToken);

    public Task<int> CountFailedRecipientsAsync(Guid campaignId, CancellationToken cancellationToken = default) =>
        _context.MarketingCampaignRecipients.CountAsync(
            r => r.MarketingCampaignId == campaignId && r.Status == MarketingCampaignRecipientStatus.Failed,
            cancellationToken);

    public async Task RemoveRecipientsForCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        await _context.MarketingCampaignRecipients
            .Where(r => r.MarketingCampaignId == campaignId)
            .ExecuteDeleteAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
