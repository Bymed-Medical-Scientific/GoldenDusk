using System.Text.RegularExpressions;
using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.ClientTypes;

public sealed class CreateClientTypeRequestValidator : AbstractValidator<CreateClientTypeRequest>
{
    private static readonly Regex SlugPattern = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public CreateClientTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Client type name is required.")
            .MaximumLength(ClientType.NameMaxLength)
            .WithMessage($"Client type name must not exceed {ClientType.NameMaxLength} characters.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Client type slug is required.")
            .MaximumLength(ClientType.SlugMaxLength)
            .WithMessage($"Client type slug must not exceed {ClientType.SlugMaxLength} characters.")
            .Matches(SlugPattern)
            .WithMessage("Client type slug must be lowercase letters, digits, and hyphens only.");
    }
}

public sealed class UpdateClientTypeRequestValidator : AbstractValidator<UpdateClientTypeRequest>
{
    private static readonly Regex SlugPattern = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public UpdateClientTypeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Client type name is required.")
            .MaximumLength(ClientType.NameMaxLength)
            .WithMessage($"Client type name must not exceed {ClientType.NameMaxLength} characters.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Client type slug is required.")
            .MaximumLength(ClientType.SlugMaxLength)
            .WithMessage($"Client type slug must not exceed {ClientType.SlugMaxLength} characters.")
            .Matches(SlugPattern)
            .WithMessage("Client type slug must be lowercase letters, digits, and hyphens only.");
    }
}
