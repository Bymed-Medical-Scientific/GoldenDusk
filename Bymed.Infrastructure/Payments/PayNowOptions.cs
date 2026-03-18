namespace Bymed.Infrastructure.Payments;

public sealed class PayNowOptions
{
    public const string SectionName = "PayNow";

    public string? IntegrationId { get; init; }
    public string? IntegrationKey { get; init; }

    public string? InitiateTransactionUrl { get; init; }
    public string? TraceUrl { get; init; }

    public string? ReturnUrl { get; init; }
    public string? ResultUrl { get; init; }
}

