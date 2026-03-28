using System.Text.RegularExpressions;
using Bymed.Domain.Entities;
using Bymed.Domain.ValueObjects;
using FluentValidation;
using PageContentEntity = Bymed.Domain.Entities.PageContent;

namespace Bymed.Application.PageContent;

public sealed class CreatePageContentRequestValidator : AbstractValidator<CreatePageContentRequest>
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public CreatePageContentRequestValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(PageContentEntity.SlugMaxLength)
            .WithMessage($"Slug must not exceed {PageContentEntity.SlugMaxLength} characters.")
            .Must(slug => SlugFormat.IsMatch(slug.Trim()))
            .WithMessage("Slug must be URL-safe: lowercase letters, digits, and hyphens only.")
            .Must(slug => !string.Equals(slug.Trim(), "manage", StringComparison.Ordinal))
            .WithMessage("Slug \"manage\" is reserved.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(PageContentEntity.TitleMaxLength)
            .WithMessage($"Title must not exceed {PageContentEntity.TitleMaxLength} characters.");

        RuleFor(x => x.Content)
            .NotNull().WithMessage("Content is required.");

        When(x => x.Metadata is not null, () =>
        {
            RuleFor(x => x.Metadata!.MetaTitle)
                .MaximumLength(PageMetadata.MetaTitleMaxLength)
                .When(x => !string.IsNullOrEmpty(x.Metadata!.MetaTitle));

            RuleFor(x => x.Metadata!.MetaDescription)
                .MaximumLength(PageMetadata.MetaDescriptionMaxLength)
                .When(x => !string.IsNullOrEmpty(x.Metadata!.MetaDescription));

            RuleFor(x => x.Metadata!.OgImage)
                .MaximumLength(PageMetadata.OgImageMaxLength)
                .When(x => !string.IsNullOrEmpty(x.Metadata!.OgImage));
        });
    }
}
