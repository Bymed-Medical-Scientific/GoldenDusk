using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class GetAllPagesQueryHandler : IRequestHandler<GetAllPagesQuery, PagedResult<PageContentDto>>
{
    private readonly IPageContentRepository _pageContentRepository;

    public GetAllPagesQueryHandler(IPageContentRepository pageContentRepository)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
    }

    public async Task<PagedResult<PageContentDto>> Handle(GetAllPagesQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);

        var paged = await _pageContentRepository
            .GetPagedAsync(pagination, cancellationToken)
            .ConfigureAwait(false);

        var dtos = paged.Items
            .Select(p => MapToDto(p))
            .ToList();

        return new PagedResult<PageContentDto>(dtos, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }

    private static PageContentDto MapToDto(Domain.Entities.PageContent p)
    {
        return new PageContentDto
        {
            Id = p.Id,
            Slug = p.Slug,
            Title = p.Title,
            Content = p.Content,
            Metadata = new PageMetadataDto
            {
                MetaTitle = p.Metadata.MetaTitle,
                MetaDescription = p.Metadata.MetaDescription,
                OgImage = p.Metadata.OgImage
            },
            PublishedAt = p.PublishedAt,
            IsPublished = p.IsPublished,
            CreationTime = p.CreationTime
        };
    }
}
