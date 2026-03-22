using Bymed.Application.Caching;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Categories;

public sealed class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICatalogReadCache _catalogReadCache;

    public GetCategoriesQueryHandler(
        ICategoryRepository categoryRepository,
        ICatalogReadCache catalogReadCache)
    {
        _categoryRepository = categoryRepository ?? throw new ArgumentNullException(nameof(categoryRepository));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var cached = await _catalogReadCache
            .TryGetCategoriesAsync(cancellationToken)
            .ConfigureAwait(false);
        if (cached is not null)
            return cached;

        var categories = await _categoryRepository
            .GetAllOrderedByDisplayOrderAsync(cancellationToken)
            .ConfigureAwait(false);

        var list = categories
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder
            })
            .ToList();

        await _catalogReadCache.SetCategoriesAsync(list, cancellationToken).ConfigureAwait(false);

        return list;
    }
}
