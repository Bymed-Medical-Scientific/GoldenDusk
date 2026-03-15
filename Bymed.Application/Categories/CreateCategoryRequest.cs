namespace Bymed.Application.Categories;

public sealed record CreateCategoryRequest
{
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public string? Description { get; init; }
    public int DisplayOrder { get; init; }
}
