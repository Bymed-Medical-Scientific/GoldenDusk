using System.Text.RegularExpressions;
using Bymed.Domain.Entities;
using Bymed.Domain.ValueObjects;
using FluentValidation;
using PageContentEntity = Bymed.Domain.Entities.PageContent;

namespace Bymed.Application.PageContent;

public sealed class UpdatePageContentRequestValidator : AbstractValidator<UpdatePageContentRequest>
{
    private static readonly Regex SlugFormat = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public UpdatePageContentRequestValidator()
    {
        When(x => !string.IsNullOrEmpty(x.Slug), () =>
        {
            RuleFor(x => x.Slug)
                .MaximumLength(PageContentEntity.SlugMaxLength)
                .WithMessage($"Slug must not exceed {PageContentEntity.SlugMaxLength} characters.")
                .Must(slug => string.IsNullOrEmpty(slug) || SlugFormat.IsMatch(slug))
                .WithMessage("Slug must be URL-safe: lowercase letters, digits, and hyphens only.");
        });

        When(x => !string.IsNullOrEmpty(x.Title), () =>
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title cannot be empty when provided.")
                .MaximumLength(PageContentEntity.TitleMaxLength)
                .WithMessage($"Title must not exceed {PageContentEntity.TitleMaxLength} characters.");
        });

        When(x => x.Metadata is not null, () =>
        {
            RuleFor(x => x.Metadata!.MetaTitle)
                .MaximumLength(PageMetadata.MetaTitleMaxLength)
                .When(x => x.Metadata is not null && !string.IsNullOrEmpty(x.Metadata.MetaTitle));

            RuleFor(x => x.Metadata!.MetaDescription)
                .MaximumLength(PageMetadata.MetaDescriptionMaxLength)
                .When(x => x.Metadata is not null && !string.IsNullOrEmpty(x.Metadata.MetaDescription));

            RuleFor(x => x.Metadata!.OgImage)
                .MaximumLength(PageMetadata.OgImageMaxLength)
                .When(x => x.Metadata is not null && !string.IsNullOrEmpty(x.Metadata.OgImage));
        });
    }
}
