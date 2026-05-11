namespace Bymed.Application.Clients;

/// <summary>
/// Lightweight row for marketing recipient expansion (no full <see cref="Bymed.Domain.Entities.Client"/> graph).
/// </summary>
public sealed record ClientMarketingProjection(
    Guid Id,
    string InstitutionName,
    string? Email1,
    string? Email2,
    string? Email3,
    string? ContactPerson1Email,
    string? ContactPerson2Email);
