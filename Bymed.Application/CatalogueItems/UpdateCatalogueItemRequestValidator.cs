using System.Text.RegularExpressions;
using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.CatalogueItems;

public sealed class UpdateCatalogueItemRequestValidator : AbstractValidator<UpdateCatalogueItemRequest>
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public UpdateCatalogueItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(CatalogueItem.NameMaxLength);

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(CatalogueItem.SlugMaxLength)
            .Must(slug => SlugFormat.IsMatch(slug ?? string.Empty))
            .WithMessage("Slug must be URL-safe: lowercase letters, digits, and hyphens only.");

        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.Brand).MaximumLength(CatalogueItem.BrandMaxLength);

        RuleFor(x => x.Sku).MaximumLength(CatalogueItem.SkuMaxLength);
    }
}
