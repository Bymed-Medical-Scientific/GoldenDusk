using FluentValidation;

namespace Bymed.Application.Orders;

public sealed class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.IdempotencyKey)
            .NotEmpty().WithMessage("Idempotency key is required.")
            .MaximumLength(64).WithMessage("Idempotency key must not exceed 64 characters.");

        RuleFor(x => x.CustomerEmail)
            .NotEmpty().WithMessage("Customer email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(256);

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Customer name is required.")
            .MaximumLength(200);

        RuleFor(x => x.ShippingAddress)
            .NotNull().WithMessage("Shipping address is required.");

        When(x => x.ShippingAddress is not null, () =>
        {
            RuleFor(x => x.ShippingAddress!.Name).NotEmpty().MaximumLength(200);
            RuleFor(x => x.ShippingAddress!.AddressLine1).NotEmpty().MaximumLength(300);
            RuleFor(x => x.ShippingAddress!.City).NotEmpty().MaximumLength(100);
            RuleFor(x => x.ShippingAddress!.State).NotEmpty().MaximumLength(100);
            RuleFor(x => x.ShippingAddress!.PostalCode).NotEmpty().MaximumLength(20);
            RuleFor(x => x.ShippingAddress!.Country).NotEmpty().MaximumLength(100);
            RuleFor(x => x.ShippingAddress!.Phone).NotEmpty().MaximumLength(30);
        });

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .MaximumLength(50);

        RuleFor(x => x.Tax).GreaterThanOrEqualTo(0).WithMessage("Tax cannot be negative.");
        RuleFor(x => x.ShippingCost).GreaterThanOrEqualTo(0).WithMessage("Shipping cost cannot be negative.");

        RuleFor(x => x)
            .Must(x => x.UserId.HasValue || !string.IsNullOrWhiteSpace(x.SessionId))
            .WithMessage("Either user id or session id must be provided.");
    }
}
