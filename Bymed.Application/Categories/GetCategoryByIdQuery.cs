using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Categories;

public sealed record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;
