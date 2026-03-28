using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class RevertPageContentToVersionCommandHandler
    : IRequestHandler<RevertPageContentToVersionCommand, Result<PageContentDto>>
{
    private readonly IPageContentRepository _pageContentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RevertPageContentToVersionCommandHandler(
        IPageContentRepository pageContentRepository,
        IUnitOfWork unitOfWork)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<PageContentDto>> Handle(
        RevertPageContentToVersionCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<PageContentDto>.Failure("Slug is required.");

        if (request.VersionId == Guid.Empty)
            return Result<PageContentDto>.Failure("Version id is required.");

        if (string.IsNullOrWhiteSpace(request.ModifiedBy))
            return Result<PageContentDto>.Failure("ModifiedBy is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<PageContentDto>.Failure("Page not found.");

        var historic = await _pageContentRepository
            .GetVersionByIdForPageAsync(request.VersionId, page.Id, cancellationToken)
            .ConfigureAwait(false);

        if (historic is null)
            return Result<PageContentDto>.Failure("Version not found.");

        var snapshot = page.RecordVersion(request.ModifiedBy);
        _pageContentRepository.AddVersion(snapshot);

        page.Update(page.Slug, page.Title, historic.Content, metadata: null);

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
