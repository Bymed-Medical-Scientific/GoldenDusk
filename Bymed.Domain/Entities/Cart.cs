using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

/// <summary>
/// Shopping cart for a user or guest (SessionId). Items are CartItems.
/// </summary>
public class Cart : BaseEntity
{
    public const int SessionIdMaxLength = 64;

    public Guid? UserId { get; private set; }
    public string? SessionId { get; private set; }

    private readonly List<CartItem> _items = [];
    public IReadOnlyCollection<CartItem> Items => _items;

    private Cart()
    {
    }

    /// <summary>
    /// Creates a cart for a registered user.
    /// </summary>
    public static Cart ForUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User Id cannot be empty.", nameof(userId));
        return new Cart { UserId = userId };
    }

    /// <summary>
    /// Creates a cart for a guest (no user). SessionId should be set by the application.
    /// </summary>
    public static Cart ForGuest(string sessionId)
    {
        ArgumentNullException.ThrowIfNull(sessionId);
        var trimmed = sessionId.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new ArgumentException("Session Id is required for guest cart.", nameof(sessionId));
        if (trimmed.Length > SessionIdMaxLength)
            throw new ArgumentException($"Session Id must not exceed {SessionIdMaxLength} characters.", nameof(sessionId));
        return new Cart { SessionId = trimmed };
    }

    /// <summary>
    /// Adds or updates quantity for a product. PriceAtAdd is the product price at time of add.
    /// </summary>
    public void AddOrUpdateItem(Guid productId, int quantity, decimal pricePerUnit)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("Product Id cannot be empty.", nameof(productId));
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        if (pricePerUnit < 0)
            throw new ArgumentException("Price cannot be negative.", nameof(pricePerUnit));

        var existing = _items.Find(i => i.ProductId == productId);
        if (existing is not null)
            existing.SetQuantity(quantity);
        else
            _items.Add(new CartItem(Id, productId, quantity, pricePerUnit));
    }

    /// <summary>
    /// Removes an item by product id.
    /// </summary>
    public void RemoveItem(Guid productId)
    {
        var index = _items.FindIndex(i => i.ProductId == productId);
        if (index >= 0)
            _items.RemoveAt(index);
    }

    /// <summary>
    /// Total price of all items (sum of Quantity * PriceAtAdd).
    /// </summary>
    public decimal GetTotal() => _items.Sum(i => i.Quantity * i.PriceAtAdd);

    /// <summary>
    /// Total number of line items (count of distinct products).
    /// </summary>
    public int GetItemCount() => _items.Sum(i => i.Quantity);

    internal void AddItem(CartItem item) => _items.Add(item);
}
