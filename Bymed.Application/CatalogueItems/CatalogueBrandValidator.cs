using Bymed.Application.Repositories;

namespace Bymed.Application.CatalogueItems;

internal static class CatalogueBrandValidator
{
    public static async Task<string?> ValidateBrandIdAsync(
        IBrandRepository brandRepository,
        Guid? brandId,
        CancellationToken cancellationToken)
    {
        if (brandId is null)
            return null;

        if (brandId == Guid.Empty)
            return "Brand id cannot be empty.";

        var brand = await brandRepository.GetByIdAsync(brandId.Value, cancellationToken).ConfigureAwait(false);
        return brand is null ? "Selected brand was not found." : null;
    }
}
