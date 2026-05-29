namespace Bymed.Application.Brands;

public sealed record BrandDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? LogoUrl { get; init; }
    public string? WebsiteUrl { get; init; }
}
