using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.CatalogueItems;

public sealed class UpdateCatalogueItemRequestValidator : AbstractValidator<UpdateCatalogueItemRequest>
{
    public UpdateCatalogueItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(CatalogueItem.NameMaxLength);

        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.Brand).MaximumLength(CatalogueItem.BrandMaxLength);
    }
}
