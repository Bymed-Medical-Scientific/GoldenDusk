using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Inventory;

public sealed class AdjustInventoryRequestValidator : AbstractValidator<AdjustInventoryRequest>
{
    public AdjustInventoryRequestValidator()
    {
        RuleFor(x => x.Adjustment)
            .NotEqual(0).WithMessage("Adjustment cannot be zero.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(InventoryLog.ReasonMaxLength)
            .WithMessage($"Reason must not exceed {InventoryLog.ReasonMaxLength} characters.");
    }
}
