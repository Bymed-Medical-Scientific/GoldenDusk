using MediatR;

namespace Bymed.Application.Categories;

public sealed record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;
