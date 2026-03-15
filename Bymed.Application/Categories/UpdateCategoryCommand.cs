using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Categories;

public sealed record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<Result<CategoryDto>>;
