using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.ValueObjects;
using MediatR;
using PageContentEntity = Bymed.Domain.Entities.PageContent;

namespace Bymed.Application.PageContent;

public sealed class CreatePageContentCommandHandler : IRequestHandler<CreatePageContentCommand, Result<PageContentDto>>
{
    private readonly IPageContentRepository _pageContentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePageContentCommandHandler(
        IPageContentRepository pageContentRepository,
        IUnitOfWork unitOfWork)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PageContentDto>> Handle(CreatePageContentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CreatedBy))
            return Result<PageContentDto>.Failure("CreatedBy is required.");

        var req = request.Request;
        var slug = req.Slug.Trim();

        var exists = await _pageContentRepository
            .ExistsSlugAsync(slug, excludePageId: null, cancellationToken)
            .ConfigureAwait(false);
        if (exists)
            return Result<PageContentDto>.Failure("A page with this slug already exists.");

        var metadata = req.Metadata is null
            ? new PageMetadata()
            : new PageMetadata(
                req.Metadata.MetaTitle?.Trim(),
                req.Metadata.MetaDescription?.Trim(),
                req.Metadata.OgImage?.Trim());

        var page = new PageContentEntity(slug, req.Title.Trim(), req.Content, metadata);

        if (req.Publish)
            page.Publish();

        _pageContentRepository.Add(page);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

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
