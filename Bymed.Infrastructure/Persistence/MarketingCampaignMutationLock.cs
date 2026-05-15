using System.Data;
using Bymed.Application.Marketing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Persistence;

/// <summary>
/// Serializes marketing campaign mutations by taking a row-level lock on the campaign inside the same
/// transaction as <see cref="Bymed.Application.Persistence.IUnitOfWork.SaveChangesAsync"/>.
/// </summary>
public sealed class MarketingCampaignMutationLock : IMarketingCampaignMutationLock
{
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
            await LockCampaignRowForUpdateAsync(campaignId, cancellationToken).ConfigureAwait(false);
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

    /// <summary>
    /// Blocks concurrent writers for this campaign until the transaction commits or rolls back.
    /// If the row does not exist, the SELECT affects zero rows and no lock is taken (handlers return not found).
    /// </summary>
    private async Task LockCampaignRowForUpdateAsync(Guid campaignId, CancellationToken cancellationToken)
    {
        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

        var ambientTx = _context.Database.CurrentTransaction?.GetDbTransaction();
        if (ambientTx is null)
        {
            _logger.LogError("No current EF transaction when acquiring marketing campaign row lock.");
            throw new InvalidOperationException("Marketing campaign write transaction was not started.");
        }

        await using var cmd = connection.CreateCommand();
        cmd.Transaction = ambientTx;
        cmd.CommandText =
            """
            SELECT 1
            FROM "MarketingCampaigns"
            WHERE "Id" = @id
            FOR UPDATE
            """;
        var p = cmd.CreateParameter();
        p.ParameterName = "id";
        p.Value = campaignId;
        cmd.Parameters.Add(p);

        _ = await cmd.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
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
