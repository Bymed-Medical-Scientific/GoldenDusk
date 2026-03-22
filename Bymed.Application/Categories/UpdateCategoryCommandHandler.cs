using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Categories;

public sealed class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public UpdateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _categoryRepository = categoryRepository ?? throw new ArgumentNullException(nameof(categoryRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (category is null)
            return Result<CategoryDto>.Failure("Category not found.");

        var req = request.Request;
        var slugExists = await _categoryRepository
            .ExistsSlugAsync(req.Slug.Trim(), excludeCategoryId: request.Id, cancellationToken)
            .ConfigureAwait(false);
        if (slugExists)
            return Result<CategoryDto>.Failure("A category with this slug already exists.");

        category.Update(
            req.Name.Trim(),
            req.Slug.Trim(),
            string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            req.DisplayOrder);

        _categoryRepository.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            DisplayOrder = category.DisplayOrder
        };

        return Result<CategoryDto>.Success(dto);
    }
}
