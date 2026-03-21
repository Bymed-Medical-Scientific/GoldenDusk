using FluentValidation;

namespace Bymed.Application.Carts;

public sealed class AddToCartRequestValidator : AbstractValidator<AddToCartRequest>
{
    private const int MaxQuantity = 999;

    public AddToCartRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("ProductId is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.")
            .LessThanOrEqualTo(MaxQuantity).WithMessage($"Quantity must not exceed {MaxQuantity}.");
    }
}
