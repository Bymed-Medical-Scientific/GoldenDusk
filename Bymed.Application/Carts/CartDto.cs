namespace Bymed.Application.Carts;

public sealed record CartDto
{
    public required Guid Id { get; init; }
    public Guid? UserId { get; init; }
    public string? SessionId { get; init; }
    public required IReadOnlyList<CartItemDto> Items { get; init; }
    public required int TotalItems { get; init; }
    public required decimal Total { get; init; }
}

