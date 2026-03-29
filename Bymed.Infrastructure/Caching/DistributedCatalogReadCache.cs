using System.Globalization;
using System.Text;
using System.Text.Json;
using Bymed.Application.Caching;
using Bymed.Application.Categories;
using Bymed.Application.Common;
using Bymed.Application.Products;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace Bymed.Infrastructure.Caching;

public sealed class DistributedCatalogReadCache : ICatalogReadCache
{
    private const string VersionKey = "bymed:catalog:version";
    private static readonly TimeSpan ProductsTtl = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan CategoriesTtl = TimeSpan.FromMinutes(15);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly IDistributedCache _cache;
    private readonly ILogger<DistributedCatalogReadCache> _logger;

    public DistributedCatalogReadCache(IDistributedCache cache, ILogger<DistributedCatalogReadCache> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvalidateAsync(CancellationToken cancellationToken)
    {
        try
        {
            var current = await GetVersionAsync(cancellationToken).ConfigureAwait(false);
            await SetVersionAsync(current + 1, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog cache invalidation failed.");
        }
    }

    public async Task<PagedResult<ProductDto>?> TryGetProductsAsync(GetProductsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var key = await BuildProductsKeyAsync(query, cancellationToken).ConfigureAwait(false);
            var bytes = await _cache.GetAsync(key, cancellationToken).ConfigureAwait(false);
            if (bytes is null || bytes.Length == 0)
                return null;

            var dto = JsonSerializer.Deserialize<ProductsCacheEnvelope>(bytes, JsonOptions);
            if (dto?.Items is null)
                return null;

            return new PagedResult<ProductDto>(
                dto.Items,
                dto.PageNumber,
                dto.PageSize,
                dto.TotalCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog cache read (products) failed.");
            return null;
        }
    }

    public async Task SetProductsAsync(
        GetProductsQuery query,
        PagedResult<ProductDto> result,
        CancellationToken cancellationToken)
    {
        try
        {
            var key = await BuildProductsKeyAsync(query, cancellationToken).ConfigureAwait(false);
            var envelope = new ProductsCacheEnvelope
            {
                Items = result.Items.ToList(),
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalCount = result.TotalCount
            };
            var bytes = JsonSerializer.SerializeToUtf8Bytes(envelope, JsonOptions);
            await _cache.SetAsync(
                    key,
                    bytes,
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ProductsTtl },
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog cache write (products) failed.");
        }
    }

    public async Task<IReadOnlyList<CategoryDto>?> TryGetCategoriesAsync(CancellationToken cancellationToken)
    {
        try
        {
            var key = await BuildCategoriesKeyAsync(cancellationToken).ConfigureAwait(false);
            var bytes = await _cache.GetAsync(key, cancellationToken).ConfigureAwait(false);
            if (bytes is null || bytes.Length == 0)
                return null;

            var list = JsonSerializer.Deserialize<List<CategoryDto>>(bytes, JsonOptions);
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog cache read (categories) failed.");
            return null;
        }
    }

    public async Task SetCategoriesAsync(IReadOnlyList<CategoryDto> categories, CancellationToken cancellationToken)
    {
        try
        {
            var key = await BuildCategoriesKeyAsync(cancellationToken).ConfigureAwait(false);
            var bytes = JsonSerializer.SerializeToUtf8Bytes(categories.ToList(), JsonOptions);
            await _cache.SetAsync(
                    key,
                    bytes,
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CategoriesTtl },
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Catalog cache write (categories) failed.");
        }
    }

    private async Task<string> BuildProductsKeyAsync(GetProductsQuery query, CancellationToken cancellationToken)
    {
        var v = await GetVersionAsync(cancellationToken).ConfigureAwait(false);
        var search = query.Search?.Trim() ?? string.Empty;
        if (search.Length > 80)
            search = search[..80];
        var brand = query.Brand?.Trim() ?? string.Empty;
        if (brand.Length > 80)
            brand = brand[..80];
        var searchPart = string.IsNullOrEmpty(search) ? "none" : Uri.EscapeDataString(search);
        var brandPart = string.IsNullOrEmpty(brand) ? "none" : Uri.EscapeDataString(brand);
        return $"bymed:catalog:{v}:products:p{query.PageNumber}:s{query.PageSize}:c{query.CategoryId}:i{query.InStock}:q{searchPart}:b{brandPart}";
    }

    private async Task<string> BuildCategoriesKeyAsync(CancellationToken cancellationToken)
    {
        var v = await GetVersionAsync(cancellationToken).ConfigureAwait(false);
        return $"bymed:catalog:{v}:categories";
    }

    private async Task<long> GetVersionAsync(CancellationToken cancellationToken)
    {
        var bytes = await _cache.GetAsync(VersionKey, cancellationToken).ConfigureAwait(false);
        if (bytes is null || bytes.Length == 0)
            return 0;
        var s = Encoding.UTF8.GetString(bytes);
        return long.TryParse(s, out var v) ? v : 0;
    }

    private async Task SetVersionAsync(long version, CancellationToken cancellationToken)
    {
        var bytes = Encoding.UTF8.GetBytes(version.ToString(CultureInfo.InvariantCulture));
        await _cache.SetAsync(
                VersionKey,
                bytes,
                new DistributedCacheEntryOptions(),
                cancellationToken)
            .ConfigureAwait(false);
    }

    private sealed class ProductsCacheEnvelope
    {
        public List<ProductDto> Items { get; set; } = [];
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }
}
