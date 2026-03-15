using System.Text.RegularExpressions;
using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Categories;

public sealed class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(Category.NameMaxLength)
            .WithMessage($"Category name must not exceed {Category.NameMaxLength} characters.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Category slug is required.")
            .MaximumLength(Category.SlugMaxLength)
            .WithMessage($"Category slug must not exceed {Category.SlugMaxLength} characters.")
            .Must(slug => SlugFormat.IsMatch(slug ?? string.Empty))
            .WithMessage("Category slug must be URL-safe: lowercase letters, digits, and hyphens only (e.g. medical-equipment).");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be zero or greater.");
    }
}
