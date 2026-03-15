using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Categories;

public sealed record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<Result<CategoryDto>>;
