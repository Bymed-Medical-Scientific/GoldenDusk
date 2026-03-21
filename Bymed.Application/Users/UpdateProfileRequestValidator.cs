using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Users;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(User.NameMaxLength)
            .WithMessage($"Name must not exceed {User.NameMaxLength} characters.");
    }
}
