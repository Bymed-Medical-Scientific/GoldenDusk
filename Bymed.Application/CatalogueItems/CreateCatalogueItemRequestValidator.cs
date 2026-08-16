using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.CatalogueItems;

public sealed class CreateCatalogueItemRequestValidator : AbstractValidator<CreateCatalogueItemRequest>
{
    public CreateCatalogueItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(CatalogueItem.NameMaxLength);

        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Category is required.");

    }
}
