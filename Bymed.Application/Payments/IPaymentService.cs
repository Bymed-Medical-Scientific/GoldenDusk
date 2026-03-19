using Bymed.Domain.Enums;

namespace Bymed.Application.Payments;

public interface IPaymentService
{
    Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string reference, CancellationToken cancellationToken = default);
    Task<PaymentResult> ConfirmPaymentAsync(string reference, CancellationToken cancellationToken = default);
    Task<WebhookResult> HandleWebhookAsync(PayNowWebhookEvent webhookEvent, CancellationToken cancellationToken = default);
    Task<RefundResult> RefundPaymentAsync(string reference, decimal? amount = null, CancellationToken cancellationToken = default);
}

public sealed class PaymentInitiationResult
{
    public bool Success { get; init; }
    public string? PaymentReference { get; init; }
    public string? RedirectUrl { get; init; }
    public string? PollUrl { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed class PaymentResult
{
    public bool Success { get; init; }
    public string? TransactionId { get; init; }
    public PaymentStatus Status { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed class RefundResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed class WebhookResult
{
    public bool Success { get; init; }
    public PaymentStatus? Status { get; init; }
    public string? Reference { get; init; }
    public string? PayNowReference { get; init; }
    public string? ErrorMessage { get; init; }
}

public sealed class PayNowWebhookEvent
{
    public required IReadOnlyDictionary<string, string> Fields { get; init; }
    public required string RawBody { get; init; }
}

