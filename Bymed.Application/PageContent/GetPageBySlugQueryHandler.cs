using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class GetPageBySlugQueryHandler : IRequestHandler<GetPageBySlugQuery, Result<PageContentDto>>
{
    private readonly IPageContentRepository _pageContentRepository;

    public GetPageBySlugQueryHandler(IPageContentRepository pageContentRepository)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
    }

    public async Task<Result<PageContentDto>> Handle(GetPageBySlugQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<PageContentDto>.Failure("Slug is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<PageContentDto>.Failure("Page not found.");

        if (!request.AllowUnpublished && !page.IsPublished)
            return Result<PageContentDto>.Failure("Page not found.");

        var dto = new PageContentDto
        {
            Id = page.Id,
            Slug = page.Slug,
            Title = page.Title,
            Content = page.Content,
            Metadata = new PageMetadataDto
            {
                MetaTitle = page.Metadata.MetaTitle,
                MetaDescription = page.Metadata.MetaDescription,
                OgImage = page.Metadata.OgImage
            },
            PublishedAt = page.PublishedAt,
            IsPublished = page.IsPublished,
            CreationTime = page.CreationTime
        };

        return Result<PageContentDto>.Success(dto);
    }
}
