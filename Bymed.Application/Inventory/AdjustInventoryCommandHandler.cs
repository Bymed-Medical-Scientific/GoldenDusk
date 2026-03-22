using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Inventory;

public sealed class AdjustInventoryCommandHandler : IRequestHandler<AdjustInventoryCommand, Result<InventoryDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IInventoryLogRepository _inventoryLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public AdjustInventoryCommandHandler(
        IProductRepository productRepository,
        IInventoryLogRepository inventoryLogRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _inventoryLogRepository = inventoryLogRepository ?? throw new ArgumentNullException(nameof(inventoryLogRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<InventoryDto>> Handle(AdjustInventoryCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository
            .GetByIdAsync(request.ProductId, cancellationToken)
            .ConfigureAwait(false);

        if (product is null)
            return Result<InventoryDto>.Failure("Product not found.");

        var newCount = product.InventoryCount + request.Request.Adjustment;
        if (newCount < 0)
            return Result<InventoryDto>.Failure("Inventory adjustment would result in a negative count.");

        product.UpdateInventory(newCount, request.Request.Reason, request.ChangedBy);
        _productRepository.Update(product);

        var inventoryLog = new InventoryLog(
            product.Id,
            product.InventoryCount - request.Request.Adjustment,
            product.InventoryCount,
            request.Request.Reason,
            request.ChangedBy);
        _inventoryLogRepository.Add(inventoryLog);

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        return Result<InventoryDto>.Success(new InventoryDto
        {
            ProductId = product.Id,
            ProductName = product.Name,
            Sku = product.Sku,
            InventoryCount = product.InventoryCount,
            LowStockThreshold = product.LowStockThreshold,
            IsAvailable = product.IsAvailable
        });
    }
}
