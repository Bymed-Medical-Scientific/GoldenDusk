using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class BulkDeleteProductsCommandHandler : IRequestHandler<BulkDeleteProductsCommand, Result<BulkOperationResultDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public BulkDeleteProductsCommandHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<BulkOperationResultDto>> Handle(BulkDeleteProductsCommand request, CancellationToken cancellationToken)
    {
        if (request.ProductIds.Count == 0)
            return Result<BulkOperationResultDto>.Failure("At least one product id is required.");

        var uniqueIds = request.ProductIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (uniqueIds.Length == 0)
            return Result<BulkOperationResultDto>.Failure("At least one valid product id is required.");

        var products = await _productRepository
            .GetByIdsAsync(uniqueIds, cancellationToken)
            .ConfigureAwait(false);

        foreach (var product in products)
        {
            product.MarkAsUnavailable();
            _productRepository.Update(product);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var result = new BulkOperationResultDto
        {
            RequestedCount = uniqueIds.Length,
            ProcessedCount = products.Count,
            NotFoundCount = uniqueIds.Length - products.Count
        };

        return Result<BulkOperationResultDto>.Success(result);
    }
}
