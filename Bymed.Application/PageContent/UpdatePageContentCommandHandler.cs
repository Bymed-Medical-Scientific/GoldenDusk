using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Domain.ValueObjects;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class UpdatePageContentCommandHandler : IRequestHandler<UpdatePageContentCommand, Result<PageContentDto>>
{
    private readonly IPageContentRepository _pageContentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePageContentCommandHandler(
        IPageContentRepository pageContentRepository,
        IUnitOfWork unitOfWork)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PageContentDto>> Handle(UpdatePageContentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<PageContentDto>.Failure("Slug is required.");

        if (string.IsNullOrWhiteSpace(request.ModifiedBy))
            return Result<PageContentDto>.Failure("ModifiedBy is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<PageContentDto>.Failure("Page not found.");

        var req = request.Request;

        var newSlug = req.Slug?.Trim() ?? page.Slug;
        var newTitle = req.Title?.Trim() ?? page.Title;
        var newContent = req.Content ?? page.Content;

        if (newSlug != page.Slug)
        {
            var slugExists = await _pageContentRepository
                .ExistsSlugAsync(newSlug, excludePageId: page.Id, cancellationToken)
                .ConfigureAwait(false);
            if (slugExists)
                return Result<PageContentDto>.Failure("A page with this slug already exists.");
        }

        var newMetadata = req.Metadata is not null
            ? new PageMetadata(
                req.Metadata.MetaTitle?.Trim(),
                req.Metadata.MetaDescription?.Trim(),
                req.Metadata.OgImage?.Trim())
            : null;

        var version = page.RecordVersion(request.ModifiedBy);

        page.Update(newSlug, newTitle, newContent, newMetadata);

        _pageContentRepository.AddVersion(version);
        _pageContentRepository.Update(page);
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
