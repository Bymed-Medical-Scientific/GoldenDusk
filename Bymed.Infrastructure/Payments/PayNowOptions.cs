namespace Bymed.Infrastructure.Payments;

public sealed class PayNowOptions
{
    public const string SectionName = "PayNow";

    public string? IntegrationId { get; init; }
    public string? IntegrationKey { get; init; }

    public string? InitiateTransactionUrl { get; init; }
    public string? TraceUrl { get; init; }

    /// <summary>Storefront origin (no trailing slash). Used to build per-order PayNow return URLs.</summary>
    public string? StorefrontBaseUrl { get; init; }

    /// <summary>Optional static fallback when StorefrontBaseUrl is not set.</summary>
    public string? ReturnUrl { get; init; }

    public string? ResultUrl { get; init; }
}

