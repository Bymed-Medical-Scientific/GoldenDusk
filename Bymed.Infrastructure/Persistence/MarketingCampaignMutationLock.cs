using Bymed.Application.Marketing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Persistence;

public sealed class MarketingCampaignMutationLock : IMarketingCampaignMutationLock
{
    /// <summary>
    /// Second argument to <c>hashtextextended</c> so marketing locks do not collide with other advisory-lock users.
    /// </summary>
    private const long AdvisoryLockNamespace = unchecked((long)0xB96D_4D4B_5447_0001UL);

    private readonly ApplicationDbContext _context;
    private readonly ILogger<MarketingCampaignMutationLock> _logger;

    public MarketingCampaignMutationLock(ApplicationDbContext context, ILogger<MarketingCampaignMutationLock> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IMarketingCampaignWriteSession> BeginAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var tx = await _context.Database.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            // Use a 64-bit hash of the full campaign id (PostgreSQL 14+). The previous int32 pair only used 64 bits of the
            // Guid and could map unrelated campaigns to the same lock key, weakening mutual exclusion.
            var idText = campaignId.ToString("D");
            await _context.Database.ExecuteSqlInterpolatedAsync(
                    $@"SELECT pg_advisory_xact_lock(hashtextextended({idText}, {AdvisoryLockNamespace}))",
                    cancellationToken)
                .ConfigureAwait(false);
            return new MarketingCampaignWriteSession(tx, _logger);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to begin marketing campaign write lock for {CampaignId}.", campaignId);
            await tx.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            await tx.DisposeAsync().ConfigureAwait(false);
            throw;
        }
    }

    private sealed class MarketingCampaignWriteSession : IMarketingCampaignWriteSession
    {
        private readonly IDbContextTransaction _tx;
        private readonly ILogger _logger;
        private bool _committed;
        private bool _disposed;

        public MarketingCampaignWriteSession(IDbContextTransaction tx, ILogger logger)
        {
            _tx = tx;
            _logger = logger;
        }

        public async Task CommitAsync(CancellationToken cancellationToken = default)
        {
            if (_committed || _disposed)
                throw new InvalidOperationException("Marketing campaign write session is already completed.");
            await _tx.CommitAsync(cancellationToken).ConfigureAwait(false);
            _committed = true;
        }

        public async ValueTask DisposeAsync()
        {
            if (_disposed)
                return;
            _disposed = true;
            try
            {
                if (!_committed)
                    await _tx.RollbackAsync(CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Rollback of marketing campaign write transaction failed.");
            }
            finally
            {
                await _tx.DisposeAsync().ConfigureAwait(false);
            }
        }
    }
}
