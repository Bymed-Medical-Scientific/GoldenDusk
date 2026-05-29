using Bymed.Domain.Entities;
using FluentValidation;

namespace Bymed.Application.Brands;

public sealed class UpdateBrandRequestValidator : AbstractValidator<UpdateBrandRequest>
{
    public UpdateBrandRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(Brand.NameMaxLength);

        RuleFor(x => x.WebsiteUrl)
            .MaximumLength(Brand.WebsiteUrlMaxLength)
            .Must(BeValidWebsiteUrlOrEmpty)
            .WithMessage("Website URL must be a valid http or https address.")
            .When(x => !string.IsNullOrWhiteSpace(x.WebsiteUrl));
    }

    private static bool BeValidWebsiteUrlOrEmpty(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;

        try
        {
            _ = Brand.NormalizeWebsiteUrl(url);
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
