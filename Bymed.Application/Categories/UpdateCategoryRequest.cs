namespace Bymed.Application.Categories;

public sealed record UpdateCategoryRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
}
