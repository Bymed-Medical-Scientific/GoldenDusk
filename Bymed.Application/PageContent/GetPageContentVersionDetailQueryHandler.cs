using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class GetPageContentVersionDetailQueryHandler
    : IRequestHandler<GetPageContentVersionDetailQuery, Result<ContentVersionDetailDto>>
{
    private readonly IPageContentRepository _pageContentRepository;

    public GetPageContentVersionDetailQueryHandler(IPageContentRepository pageContentRepository)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
    }

    public async Task<Result<ContentVersionDetailDto>> Handle(
        GetPageContentVersionDetailQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<ContentVersionDetailDto>.Failure("Slug is required.");

        if (request.VersionId == Guid.Empty)
            return Result<ContentVersionDetailDto>.Failure("Version id is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<ContentVersionDetailDto>.Failure("Page not found.");

        var version = await _pageContentRepository
            .GetVersionByIdForPageAsync(request.VersionId, page.Id, cancellationToken)
            .ConfigureAwait(false);

        if (version is null)
            return Result<ContentVersionDetailDto>.Failure("Version not found.");

        return Result<ContentVersionDetailDto>.Success(
            new ContentVersionDetailDto
            {
                Id = version.Id,
                CreatedAt = version.CreatedAt,
                CreatedBy = version.CreatedBy,
                Content = version.Content
            });
    }
}
