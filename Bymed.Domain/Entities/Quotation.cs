using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class Quotation : BaseEntity
{
    public const int QuotationNumberMaxLength = 50;
    public const int CustomerNameMaxLength = 200;
    public const int CustomerInstitutionMaxLength = 200;
    public const int CustomerEmailMaxLength = 254;
    public const int CustomerPhoneMaxLength = 30;
    public const int CustomerAddressMaxLength = 500;
    public const int SubjectMaxLength = 300;
    public const int NotesMaxLength = 2000;
    public const int TermsMaxLength = 2000;
    public const int CurrencyCodeMaxLength = 3;
    public const int PurchaseOrderReferenceMaxLength = 100;

    public string QuotationNumber { get; private set; } = string.Empty;
    public QuotationStatus Status { get; private set; } = QuotationStatus.Draft;
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerInstitution { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public string CustomerAddress { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string? Notes { get; private set; }
    public string? TermsAndConditions { get; private set; }
    public string TargetCurrencyCode { get; private set; } = "USD";
    public decimal VatPercent { get; private set; } = 15.5m;
    public bool ShowVatOnDocument { get; private set; } = true;
    public bool? HasPurchaseOrder { get; private set; }
    public string? PurchaseOrderReference { get; private set; }
    public decimal SubtotalExcludingVat { get; private set; }
    public decimal VatAmount { get; private set; }
    public decimal TotalIncludingVat { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? FinalizedAtUtc { get; private set; }

    private readonly List<QuotationItem> _items = [];
    public IReadOnlyCollection<QuotationItem> Items => _items;

    private Quotation() { }

    public Quotation(
        string quotationNumber,
        string customerName,
        string customerInstitution,
        string customerEmail,
        string customerPhone,
        string customerAddress,
        string subject,
        string targetCurrencyCode,
        decimal vatPercent,
        bool showVatOnDocument,
        string? notes,
        string? termsAndConditions,
        DateTime createdAtUtc)
    {
        SetQuotationNumber(quotationNumber);
        SetCustomerName(customerName);
        SetCustomerInstitution(customerInstitution);
        SetCustomerEmail(customerEmail);
        SetCustomerPhone(customerPhone);
        SetCustomerAddress(customerAddress);
        SetSubject(subject);
        SetTargetCurrencyCode(targetCurrencyCode);
        SetVatPercent(vatPercent);
        ShowVatOnDocument = showVatOnDocument;
        SetNotes(notes);
        SetTermsAndConditions(termsAndConditions);
        CreatedAtUtc = createdAtUtc;
    }

    public void UpdateMetadata(
        string customerName,
        string customerInstitution,
        string customerEmail,
        string customerPhone,
        string customerAddress,
        string subject,
        string targetCurrencyCode,
        decimal vatPercent,
        bool showVatOnDocument,
        string? notes,
        string? termsAndConditions)
    {
        EnsureDraft();
        SetCustomerName(customerName);
        SetCustomerInstitution(customerInstitution);
        SetCustomerEmail(customerEmail);
        SetCustomerPhone(customerPhone);
        SetCustomerAddress(customerAddress);
        SetSubject(subject);
        SetTargetCurrencyCode(targetCurrencyCode);
        SetVatPercent(vatPercent);
        ShowVatOnDocument = showVatOnDocument;
        SetNotes(notes);
        SetTermsAndConditions(termsAndConditions);
    }

    public QuotationItem AddItem(
        Guid productId,
        string productNameSnapshot,
        string? productSkuSnapshot,
        string? productImageUrlSnapshot,
        int quantity,
        decimal supplierUnitCost,
        string sourceCurrencyCode,
        decimal exchangeRateToTarget,
        decimal markupMultiplier)
    {
        EnsureDraft();
        var item = new QuotationItem(
            Id,
            productId,
            productNameSnapshot,
            productSkuSnapshot,
            productImageUrlSnapshot,
            quantity,
            supplierUnitCost,
            sourceCurrencyCode,
            exchangeRateToTarget,
            markupMultiplier,
            VatPercent);
        _items.Add(item);
        RecalculateTotals();
        return item;
    }

    public void UpdateItem(
        Guid itemId,
        int quantity,
        decimal supplierUnitCost,
        string sourceCurrencyCode,
        decimal exchangeRateToTarget,
        decimal markupMultiplier)
    {
        EnsureDraft();
        var item = _items.FirstOrDefault(x => x.Id == itemId)
            ?? throw new InvalidOperationException("Quotation item not found.");
        item.UpdatePricing(quantity, supplierUnitCost, sourceCurrencyCode, exchangeRateToTarget, markupMultiplier, VatPercent);
        RecalculateTotals();
    }

    public void RemoveItem(Guid itemId)
    {
        EnsureDraft();
        var item = _items.FirstOrDefault(x => x.Id == itemId)
            ?? throw new InvalidOperationException("Quotation item not found.");
        _items.Remove(item);
        RecalculateTotals();
    }

    public void Finalize(DateTime finalizedAtUtc)
    {
        if (_items.Count == 0)
            throw new InvalidOperationException("Cannot finalize quotation without items.");
        if (Status != QuotationStatus.Draft)
            throw new InvalidOperationException("Only draft quotations can be finalized.");
        Status = QuotationStatus.Finalized;
        FinalizedAtUtc = finalizedAtUtc;
    }

    public void UpdatePurchaseOrder(bool hasPurchaseOrder, string? purchaseOrderReference)
    {
        if (Status != QuotationStatus.Finalized)
            throw new InvalidOperationException("Purchase order can only be updated for finalized quotations.");

        if (hasPurchaseOrder)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(purchaseOrderReference);
            var trimmed = purchaseOrderReference.Trim();
            if (trimmed.Length > PurchaseOrderReferenceMaxLength)
                throw new ArgumentException(
                    $"Purchase order reference must not exceed {PurchaseOrderReferenceMaxLength} characters.",
                    nameof(purchaseOrderReference));
            HasPurchaseOrder = true;
            PurchaseOrderReference = trimmed;
            return;
        }

        HasPurchaseOrder = false;
        PurchaseOrderReference = null;
    }

    public void RecalculateTotals()
    {
        SubtotalExcludingVat = _items.Sum(x => x.LineSubtotalExcludingVat);
        VatAmount = _items.Sum(x => x.LineVatAmount);
        TotalIncludingVat = _items.Sum(x => x.LineTotalIncludingVat);
    }

    private void EnsureDraft()
    {
        if (Status != QuotationStatus.Draft)
            throw new InvalidOperationException("Only draft quotations can be modified.");
    }

    private void SetQuotationNumber(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > QuotationNumberMaxLength)
            throw new ArgumentException($"Quotation number must not exceed {QuotationNumberMaxLength} characters.", nameof(value));
        QuotationNumber = trimmed;
    }

    private void SetCustomerName(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > CustomerNameMaxLength)
            throw new ArgumentException($"Customer name must not exceed {CustomerNameMaxLength} characters.", nameof(value));
        CustomerName = trimmed;
    }

    private void SetCustomerInstitution(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > CustomerInstitutionMaxLength)
            throw new ArgumentException($"Customer institution must not exceed {CustomerInstitutionMaxLength} characters.", nameof(value));
        CustomerInstitution = trimmed;
    }

    private void SetCustomerEmail(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > CustomerEmailMaxLength)
            throw new ArgumentException($"Customer email must not exceed {CustomerEmailMaxLength} characters.", nameof(value));
        CustomerEmail = trimmed;
    }

    private void SetCustomerPhone(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > CustomerPhoneMaxLength)
            throw new ArgumentException($"Customer phone must not exceed {CustomerPhoneMaxLength} characters.", nameof(value));
        CustomerPhone = trimmed;
    }

    private void SetCustomerAddress(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > CustomerAddressMaxLength)
            throw new ArgumentException($"Customer address must not exceed {CustomerAddressMaxLength} characters.", nameof(value));
        CustomerAddress = trimmed;
    }

    private void SetSubject(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim();
        if (trimmed.Length > SubjectMaxLength)
            throw new ArgumentException($"Subject must not exceed {SubjectMaxLength} characters.", nameof(value));
        Subject = trimmed;
    }

    private void SetTargetCurrencyCode(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        var trimmed = value.Trim().ToUpperInvariant();
        if (trimmed.Length > CurrencyCodeMaxLength)
            throw new ArgumentException($"Target currency code must not exceed {CurrencyCodeMaxLength} characters.", nameof(value));
        TargetCurrencyCode = trimmed;
    }

    private void SetVatPercent(decimal value)
    {
        if (value < 0 || value > 100)
            throw new ArgumentOutOfRangeException(nameof(value), "VAT percent must be between 0 and 100.");
        VatPercent = value;
        foreach (var item in _items)
            item.UpdateVatPercent(VatPercent);
        RecalculateTotals();
    }

    private void SetNotes(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Notes = null;
            return;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > NotesMaxLength)
            throw new ArgumentException($"Notes must not exceed {NotesMaxLength} characters.", nameof(value));
        Notes = trimmed;
    }

    private void SetTermsAndConditions(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            TermsAndConditions = null;
            return;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > TermsMaxLength)
            throw new ArgumentException($"Terms and conditions must not exceed {TermsMaxLength} characters.", nameof(value));
        TermsAndConditions = trimmed;
    }
}
