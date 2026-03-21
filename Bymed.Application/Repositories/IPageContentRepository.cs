using Bymed.Application.Common;
using Bymed.Domain.Entities;
using PageContentEntity = Bymed.Domain.Entities.PageContent;

namespace Bymed.Application.Repositories;

public interface IPageContentRepository
{
    Task<PageContentEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PageContentEntity?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<PageContentEntity>> GetPagedAsync(PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<bool> ExistsSlugAsync(string slug, Guid? excludePageId = null, CancellationToken cancellationToken = default);
    void Add(PageContentEntity pageContent);
    void Update(PageContentEntity pageContent);
    void AddVersion(ContentVersion version);
}
