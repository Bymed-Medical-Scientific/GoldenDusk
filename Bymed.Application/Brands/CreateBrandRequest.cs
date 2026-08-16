namespace Bymed.Application.Brands;

public sealed record CreateBrandRequest
{
    public required string Name { get; init; }
    public string? WebsiteUrl { get; init; }
}
