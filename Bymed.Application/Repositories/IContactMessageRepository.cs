using Bymed.Application.Common;
using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface IContactMessageRepository
{
    void Add(ContactMessage contactMessage);
    Task<PagedResult<ContactMessage>> GetPagedAsync(
        PaginationParams pagination,
        string? email,
        string? subject,
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        CancellationToken cancellationToken = default);
}
