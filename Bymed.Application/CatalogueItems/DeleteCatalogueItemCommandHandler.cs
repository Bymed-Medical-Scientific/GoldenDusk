using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.CatalogueItems;

public sealed class DeleteCatalogueItemCommandHandler : IRequestHandler<DeleteCatalogueItemCommand, Result>
{
    private readonly ICatalogueItemRepository _catalogueItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public DeleteCatalogueItemCommandHandler(
        ICatalogueItemRepository catalogueItemRepository,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _catalogueItemRepository = catalogueItemRepository
            ?? throw new ArgumentNullException(nameof(catalogueItemRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result> Handle(DeleteCatalogueItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _catalogueItemRepository
            .GetByIdAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (item is null)
            return Result.Failure("Catalogue item not found.");

        item.Unpublish();
        _catalogueItemRepository.Update(item);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
