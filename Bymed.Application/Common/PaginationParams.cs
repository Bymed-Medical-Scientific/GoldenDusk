namespace Bymed.Application.Common;

/// <summary>
/// Standard parameters for paginated list queries. Use to constrain page size and avoid large payloads.
/// </summary>
public sealed record PaginationParams(int PageNumber = 1, int PageSize = 20)
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 20;

    public int PageNumber { get; } = PageNumber < 1 ? 1 : PageNumber;
    public int PageSize { get; } = PageSize switch
    {
        < 1 => DefaultPageSize,
        > MaxPageSize => MaxPageSize,
        _ => PageSize
    };

    public int Skip => (PageNumber - 1) * PageSize;
}
