using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class PaymentTransactionRepository : IPaymentTransactionRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentTransactionRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PaymentTransaction?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reference))
            return null;

        return await _context.PaymentTransactions
            .FirstOrDefaultAsync(x => x.Reference == reference.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<PaymentTransaction?> GetByPayNowReferenceAsync(string payNowReference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(payNowReference))
            return null;

        return await _context.PaymentTransactions
            .FirstOrDefaultAsync(x => x.PayNowReference == payNowReference.Trim(), cancellationToken)
            .ConfigureAwait(false);
    }

    public void Add(PaymentTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        _context.PaymentTransactions.Add(transaction);
    }

    public void Update(PaymentTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        _context.PaymentTransactions.Update(transaction);
    }
}

