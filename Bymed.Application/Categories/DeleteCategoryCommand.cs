using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Categories;

public sealed record DeleteCategoryCommand(Guid Id) : IRequest<Result>;
