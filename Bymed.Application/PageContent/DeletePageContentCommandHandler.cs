using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.PageContent;

public sealed class DeletePageContentCommandHandler : IRequestHandler<DeletePageContentCommand, Result<Unit>>
{
    private readonly IPageContentRepository _pageContentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePageContentCommandHandler(
        IPageContentRepository pageContentRepository,
        IUnitOfWork unitOfWork)
    {
        _pageContentRepository = pageContentRepository ?? throw new ArgumentNullException(nameof(pageContentRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<Unit>> Handle(DeletePageContentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return Result<Unit>.Failure("Slug is required.");

        var page = await _pageContentRepository
            .GetBySlugAsync(request.Slug.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
            return Result<Unit>.Failure("Page not found.");

        _pageContentRepository.Remove(page);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Unit>.Success(Unit.Value);
    }
}
