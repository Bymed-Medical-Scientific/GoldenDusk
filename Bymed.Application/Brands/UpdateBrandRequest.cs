namespace Bymed.Application.Brands;

public sealed record UpdateBrandRequest
{
    public required string Name { get; init; }
    public string? WebsiteUrl { get; init; }
}
