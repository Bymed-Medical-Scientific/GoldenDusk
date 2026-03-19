using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IPaymentTransactionRepository
{
    Task<PaymentTransaction?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default);
    Task<PaymentTransaction?> GetByPayNowReferenceAsync(string payNowReference, CancellationToken cancellationToken = default);
    void Add(PaymentTransaction transaction);
    void Update(PaymentTransaction transaction);
}

