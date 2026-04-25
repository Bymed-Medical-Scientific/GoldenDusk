using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class GetContactMessagesQueryHandler : IRequestHandler<GetContactMessagesQuery, PagedResult<ContactMessageSummaryDto>>
{
    private readonly IContactMessageRepository _contactMessageRepository;

    public GetContactMessagesQueryHandler(IContactMessageRepository contactMessageRepository)
    {
        _contactMessageRepository = contactMessageRepository ?? throw new ArgumentNullException(nameof(contactMessageRepository));
    }

    public async Task<PagedResult<ContactMessageSummaryDto>> Handle(GetContactMessagesQuery request, CancellationToken cancellationToken)
    {
        var pagination = new PaginationParams(request.PageNumber, request.PageSize);
        var paged = await _contactMessageRepository
            .GetPagedAsync(
                pagination,
                request.Email,
                request.Subject,
                request.DateFromUtc,
                request.DateToUtc,
                cancellationToken)
            .ConfigureAwait(false);
        var items = paged.Items
            .Select(x => new ContactMessageSummaryDto
            {
                Id = x.Id,
                Name = x.Name,
                Email = x.Email,
                Subject = x.Subject,
                Message = x.Message,
                SubmittedAtUtc = x.SubmittedAtUtc
            })
            .ToList();

        return new PagedResult<ContactMessageSummaryDto>(items, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }
}
