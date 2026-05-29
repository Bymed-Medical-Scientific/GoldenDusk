using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Products;

public sealed class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(Product.NameMaxLength)
            .WithMessage($"Product name must not exceed {Product.NameMaxLength} characters.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative.");

        RuleFor(x => x.LowStockThreshold)
            .GreaterThanOrEqualTo(0).WithMessage("Low stock threshold cannot be negative.");

        RuleFor(x => x.Brand)
            .MaximumLength(Product.BrandMaxLength)
            .WithMessage($"Brand must not exceed {Product.BrandMaxLength} characters.");

        RuleFor(x => x.ClientType)
            .MaximumLength(Product.ClientTypeMaxLength)
            .WithMessage($"Client type must not exceed {Product.ClientTypeMaxLength} characters.")
            .Must(clientType =>
                string.IsNullOrWhiteSpace(clientType) ||
                ProductClientTypes.Allowed.Contains(clientType.Trim()))
            .WithMessage("Client type is invalid.");
    }
}
