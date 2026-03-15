using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;
using Bymed.Domain.ValueObjects;

namespace Bymed.Domain.Entities;

public class Order : FullAuditedEntity
{
    public const int OrderNumberMaxLength = 50;
    public const int CustomerEmailMaxLength = 256;
    public const int CustomerNameMaxLength = 200;
    public const int PaymentReferenceMaxLength = 100;
    public const int PaymentMethodMaxLength = 50;
    public const int TrackingNumberMaxLength = 100;
    public const int NotesMaxLength = 2000;
    public const int CurrencyMaxLength = 3;

    public string OrderNumber { get; private set; } = string.Empty;
    public Guid? UserId { get; private set; }
    public OrderStatus Status { get; private set; }
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerName { get; private set; } = string.Empty;
    public ShippingAddress ShippingAddress { get; private set; } = null!;
    public decimal Subtotal { get; private set; }
    public decimal Tax { get; private set; }
    public decimal ShippingCost { get; private set; }
    public decimal Total { get; private set; }
    public string Currency { get; private set; } = Product.DefaultCurrency;
    public decimal ExchangeRate { get; private set; } = 1m;
    public PaymentStatus PaymentStatus { get; private set; }
    public string PaymentReference { get; private set; } = string.Empty;
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? TrackingNumber { get; private set; }
    public string? Notes { get; private set; }

    private readonly List<OrderItem> _items = [];
    public IReadOnlyCollection<OrderItem> Items => _items;

    public User? User { get; private set; }

    private Order()
    {
    }

    public Order(
        string orderNumber,
        Guid? userId,
        string customerEmail,
        string customerName,
        ShippingAddress shippingAddress,
        string currency,
        decimal exchangeRate,
        string paymentReference,
        string paymentMethod,
        PaymentStatus paymentStatus = PaymentStatus.Pending)
    {
        SetOrderNumber(orderNumber);
        UserId = userId;
        Status = OrderStatus.Pending;
        SetCustomerEmail(customerEmail);
        SetCustomerName(customerName);
        ShippingAddress = shippingAddress ?? throw new ArgumentNullException(nameof(shippingAddress));
        Currency = ValidateCurrency(currency);
        if (exchangeRate <= 0)
            throw new ArgumentException("Exchange rate must be positive.", nameof(exchangeRate));
        ExchangeRate = exchangeRate;
        SetPaymentReference(paymentReference);
        SetPaymentMethod(paymentMethod);
        PaymentStatus = paymentStatus;
    }

    public void AddItem(Guid productId, string productName, string productImageUrl, int quantity, decimal pricePerUnit)
    {
        var item = new OrderItem(Id, productId, productName, productImageUrl ?? string.Empty, quantity, pricePerUnit);
        _items.Add(item);
    }

    public void SetTaxAndShipping(decimal tax, decimal shippingCost)
    {
        if (tax < 0)
            throw new ArgumentException("Tax cannot be negative.", nameof(tax));
        if (shippingCost < 0)
            throw new ArgumentException("Shipping cost cannot be negative.", nameof(shippingCost));
        Tax = tax;
        ShippingCost = shippingCost;
    }

    public void RecalculateTotals()
    {
        Subtotal = _items.Sum(i => i.Subtotal);
        Total = Subtotal + Tax + ShippingCost;
    }

    public void SetStatus(OrderStatus status)
    {
        Status = status;
    }

    public void SetPaymentStatus(PaymentStatus status)
    {
        PaymentStatus = status;
    }

    public void SetTrackingNumber(string? trackingNumber)
    {
        if (string.IsNullOrWhiteSpace(trackingNumber))
        {
            TrackingNumber = null;
            return;
        }
        var trimmed = trackingNumber.Trim();
        if (trimmed.Length > TrackingNumberMaxLength)
            throw new ArgumentException($"Tracking number must not exceed {TrackingNumberMaxLength} characters.", nameof(trackingNumber));
        TrackingNumber = trimmed;
    }

    public void SetNotes(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            Notes = null;
            return;
        }
        var trimmed = notes.Trim();
        if (trimmed.Length > NotesMaxLength)
            throw new ArgumentException($"Notes must not exceed {NotesMaxLength} characters.", nameof(notes));
        Notes = trimmed;
    }

    private void SetOrderNumber(string orderNumber)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(orderNumber);
        var trimmed = orderNumber.Trim();
        if (trimmed.Length > OrderNumberMaxLength)
            throw new ArgumentException($"Order number must not exceed {OrderNumberMaxLength} characters.", nameof(orderNumber));
        OrderNumber = trimmed;
    }

    private void SetCustomerEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        var trimmed = email.Trim();
        if (trimmed.Length > CustomerEmailMaxLength)
            throw new ArgumentException($"Customer email must not exceed {CustomerEmailMaxLength} characters.", nameof(email));
        CustomerEmail = trimmed;
    }

    private void SetCustomerName(string name)
    {
        ArgumentNullException.ThrowIfNull(name);
        var trimmed = name.Trim();
        if (trimmed.Length > CustomerNameMaxLength)
            throw new ArgumentException($"Customer name must not exceed {CustomerNameMaxLength} characters.", nameof(name));
        CustomerName = trimmed;
    }

    private void SetPaymentReference(string reference)
    {
        ArgumentNullException.ThrowIfNull(reference);
        var trimmed = reference.Trim();
        if (trimmed.Length > PaymentReferenceMaxLength)
            throw new ArgumentException($"Payment reference must not exceed {PaymentReferenceMaxLength} characters.", nameof(reference));
        PaymentReference = trimmed;
    }

    private void SetPaymentMethod(string method)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(method);
        var trimmed = method.Trim();
        if (trimmed.Length > PaymentMethodMaxLength)
            throw new ArgumentException($"Payment method must not exceed {PaymentMethodMaxLength} characters.", nameof(method));
        PaymentMethod = trimmed;
    }

    private static string ValidateCurrency(string currency)
    {
        ArgumentNullException.ThrowIfNull(currency);
        var trimmed = currency.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(trimmed))
            return Product.DefaultCurrency;
        if (trimmed.Length > CurrencyMaxLength)
            throw new ArgumentException($"Currency must not exceed {CurrencyMaxLength} characters.", nameof(currency));
        return trimmed;
    }

    internal void AddItem(OrderItem item) => _items.Add(item);
}
