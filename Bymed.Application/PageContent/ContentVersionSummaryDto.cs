namespace Bymed.Application.PageContent;

public sealed record ContentVersionSummaryDto
{
    public required Guid Id { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required string CreatedBy { get; init; }
}
