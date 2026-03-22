using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Categories;

public sealed class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public CreateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _categoryRepository = categoryRepository ?? throw new ArgumentNullException(nameof(categoryRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var slugExists = await _categoryRepository
            .ExistsSlugAsync(req.Slug.Trim(), excludeCategoryId: null, cancellationToken)
            .ConfigureAwait(false);
        if (slugExists)
            return Result<CategoryDto>.Failure("A category with this slug already exists.");

        var category = new Category(
            req.Name.Trim(),
            req.Slug.Trim(),
            string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            req.DisplayOrder);

        _categoryRepository.Add(category);
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
