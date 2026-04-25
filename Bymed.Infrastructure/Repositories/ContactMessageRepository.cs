using Bymed.Application.Common;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using Bymed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Repositories;

public sealed class ContactMessageRepository : IContactMessageRepository
{
    private readonly ApplicationDbContext _context;

    public ContactMessageRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public void Add(ContactMessage contactMessage)
    {
        ArgumentNullException.ThrowIfNull(contactMessage);
        _context.ContactMessages.Add(contactMessage);
    }

    public async Task<PagedResult<ContactMessage>> GetPagedAsync(
        PaginationParams pagination,
        string? email,
        string? subject,
        DateTime? dateFromUtc,
        DateTime? dateToUtc,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ContactMessages.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(email))
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            query = query.Where(x => x.Email.ToLower().Contains(normalizedEmail));
        }

        if (!string.IsNullOrWhiteSpace(subject))
        {
            var normalizedSubject = subject.Trim().ToLowerInvariant();
            query = query.Where(x => x.Subject.ToLower().Contains(normalizedSubject));
        }

        if (dateFromUtc.HasValue)
            query = query.Where(x => x.SubmittedAtUtc >= dateFromUtc.Value);
        if (dateToUtc.HasValue)
            query = query.Where(x => x.SubmittedAtUtc <= dateToUtc.Value);

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await query
            .OrderByDescending(x => x.SubmittedAtUtc)
            .Skip(pagination.Skip)
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedResult<ContactMessage>(items, pagination.PageNumber, pagination.PageSize, totalCount);
    }
}
