using System.Globalization;
using System.Text;
using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Products;

public sealed class ImportProductsCsvCommandHandler : IRequestHandler<ImportProductsCsvCommand, Result<ImportProductsResultDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogReadCache _catalogReadCache;

    public ImportProductsCsvCommandHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ICatalogReadCache catalogReadCache)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogReadCache = catalogReadCache ?? throw new ArgumentNullException(nameof(catalogReadCache));
    }

    public async Task<Result<ImportProductsResultDto>> Handle(ImportProductsCsvCommand request, CancellationToken cancellationToken)
    {
        if (request.Content is null || request.Content.Length == 0)
            return Result<ImportProductsResultDto>.Failure("CSV content is required.");

        var text = Encoding.UTF8.GetString(request.Content);
        var lines = text
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .ToArray();

        if (lines.Length <= 1)
            return Result<ImportProductsResultDto>.Failure("CSV must include a header and at least one data row.");

        var imported = 0;
        var updated = 0;
        var errors = new List<string>();

        for (var i = 1; i < lines.Length; i++)
        {
            var lineNumber = i + 1;
            var columns = ParseCsvLine(lines[i]);
            if (columns.Count < 10)
            {
                errors.Add($"Line {lineNumber}: Expected at least 10 columns.");
                continue;
            }

            try
            {
                var name = columns[0];
                var slug = columns[1];
                var description = columns[2];
                var categoryId = Guid.Parse(columns[3]);
                var price = decimal.Parse(columns[4], CultureInfo.InvariantCulture);
                var currency = columns[5];
                var inventoryCount = int.Parse(columns[6], CultureInfo.InvariantCulture);
                var lowStockThreshold = int.Parse(columns[7], CultureInfo.InvariantCulture);
                var isAvailable = bool.Parse(columns[8]);
                var sku = string.IsNullOrWhiteSpace(columns[9]) ? null : columns[9];

                var existing = await _productRepository.GetBySlugAsync(slug, cancellationToken).ConfigureAwait(false);
                if (existing is null)
                {
                    var product = new Product(
                        name,
                        slug,
                        description,
                        categoryId,
                        price,
                        inventoryCount,
                        lowStockThreshold,
                        sku,
                        currency);

                    product.SetAvailability(isAvailable);
                    _productRepository.Add(product);
                    imported++;
                }
                else
                {
                    existing.Update(
                        name,
                        slug,
                        description,
                        categoryId,
                        price,
                        lowStockThreshold,
                        sku);

                    existing.UpdateInventory(inventoryCount, "CSV import", "admin-import");
                    existing.SetAvailability(isAvailable);
                    _productRepository.Update(existing);
                    updated++;
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Line {lineNumber}: {ex.Message}");
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        var result = new ImportProductsResultDto
        {
            ImportedCount = imported,
            UpdatedCount = updated,
            FailedCount = errors.Count,
            Errors = errors
        };

        return Result<ImportProductsResultDto>.Success(result);
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }

                continue;
            }

            if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
                continue;
            }

            current.Append(c);
        }

        result.Add(current.ToString().Trim());
        return result;
    }
}
