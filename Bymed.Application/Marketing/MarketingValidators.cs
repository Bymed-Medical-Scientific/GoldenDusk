using FluentValidation;

namespace Bymed.Application.Marketing;

public sealed class CreateMarketingCampaignCommandValidator : AbstractValidator<CreateMarketingCampaignCommand>
{
    public CreateMarketingCampaignCommandValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty()
            .MaximumLength(Bymed.Domain.Entities.MarketingCampaign.SubjectMaxLength);

        RuleFor(x => x.HtmlBody)
            .MaximumLength(Bymed.Domain.Entities.MarketingCampaign.HtmlBodyMaxLength)
            .When(x => !string.IsNullOrEmpty(x.HtmlBody));

        RuleFor(x => x.ClientTypeIds)
            .NotEmpty()
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("Client type ids must be unique.");

        RuleFor(x => x)
            .Must(x => x.IncludeInstitutionEmails || x.IncludeContactPersonEmails)
            .WithMessage("Select at least one recipient group (institution and/or contact emails).");
    }
}

public sealed class AddMarketingCampaignAttachmentsCommandValidator : AbstractValidator<AddMarketingCampaignAttachmentsCommand>
{
    public AddMarketingCampaignAttachmentsCommandValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty();
        RuleFor(x => x.Files).NotNull();
        RuleForEach(x => x.Files).ChildRules(f =>
        {
            f.RuleFor(x => x.FileName).NotEmpty().MaximumLength(260);
            f.RuleFor(x => x.ContentType).NotEmpty().MaximumLength(120);
            f.RuleFor(x => x.Content).NotEmpty();
        });
    }
}

public sealed class StartMarketingCampaignCommandValidator : AbstractValidator<StartMarketingCampaignCommand>
{
    public StartMarketingCampaignCommandValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty();
    }
}

public sealed class GetMarketingCampaignPreviewQueryValidator : AbstractValidator<GetMarketingCampaignPreviewQuery>
{
    public GetMarketingCampaignPreviewQueryValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty();
    }
}

public sealed class GetMarketingCampaignStatusQueryValidator : AbstractValidator<GetMarketingCampaignStatusQuery>
{
    public GetMarketingCampaignStatusQueryValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty();
    }
}
