namespace Bymed.Application.Clients;

/// <summary>
/// Lightweight row for marketing recipient expansion (no full <see cref="Bymed.Domain.Entities.Client"/> graph).
/// </summary>
public sealed record ClientMarketingProjection(
    Guid Id,
    string InstitutionName,
    string? InstitutionEmail,
    IReadOnlyList<string> ContactPersonEmails);
