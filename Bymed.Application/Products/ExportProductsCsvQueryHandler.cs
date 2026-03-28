using System.Text;
using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Products;

public sealed class ExportProductsCsvQueryHandler : IRequestHandler<ExportProductsCsvQuery, Result<string>>
{
    private readonly IProductRepository _productRepository;

    public ExportProductsCsvQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }

    public async Task<Result<string>> Handle(ExportProductsCsvQuery request, CancellationToken cancellationToken)
    {
        var ids = request.ProductIds?
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        var products = ids is { Length: > 0 }
            ? await _productRepository.GetByIdsAsync(ids, cancellationToken).ConfigureAwait(false)
            : await _productRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);

        var csv = BuildCsv(products);
        return Result<string>.Success(csv);
    }

    private static string BuildCsv(IReadOnlyList<Bymed.Domain.Entities.Product> products)
    {
        var builder = new StringBuilder();
        builder.AppendLine("id,name,slug,description,categoryId,categoryName,price,currency,inventoryCount,lowStockThreshold,isAvailable,sku");

        foreach (var p in products)
        {
            builder.AppendLine(
                string.Join(",",
                    Escape(p.Id.ToString()),
                    Escape(p.Name),
                    Escape(p.Slug),
                    Escape(p.Description),
                    Escape(p.CategoryId.ToString()),
                    Escape(p.Category?.Name ?? string.Empty),
                    Escape(p.Price.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                    Escape(p.Currency),
                    Escape(p.InventoryCount.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                    Escape(p.LowStockThreshold.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                    Escape(p.IsAvailable ? "true" : "false"),
                    Escape(p.Sku ?? string.Empty)));
        }

        return builder.ToString();
    }

    private static string Escape(string value)
    {
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}
