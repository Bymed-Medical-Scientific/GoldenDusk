using Bymed.Domain.Enums;
using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class QuoteRequest : BaseEntity
{
    public const int FullNameMaxLength = 100;
    public const int InstitutionMaxLength = 200;
    public const int EmailMaxLength = 254;
    public const int PhoneMaxLength = 30;
    public const int AddressMaxLength = 500;
    public const int NotesMaxLength = 2000;

    public string FullName { get; private set; } = string.Empty;
    public string Institution { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;
    public QuoteRequestStatus Status { get; private set; } = QuoteRequestStatus.Submitted;
    public DateTime SubmittedAtUtc { get; private set; }

    private readonly List<QuoteRequestItem> _items = new();
    public IReadOnlyCollection<QuoteRequestItem> Items => _items;

    private QuoteRequest() { }

    public QuoteRequest(
        string fullName,
        string institution,
        string email,
        string phoneNumber,
        string address,
        string notes,
        DateTime submittedAtUtc)
    {
        SetFullName(fullName);
        SetInstitution(institution);
        SetEmail(email);
        SetPhoneNumber(phoneNumber);
        SetAddress(address);
        SetNotes(notes);
        SubmittedAtUtc = submittedAtUtc;
    }

    public void AddItem(Guid productId, string productNameSnapshot, string skuSnapshot, int quantity)
    {
        var item = new QuoteRequestItem(Id, productId, productNameSnapshot, skuSnapshot, quantity);
        _items.Add(item);
    }

    public void SetStatus(QuoteRequestStatus status) => Status = status;

    private void SetFullName(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Full name is required.", nameof(value));
        if (trimmed.Length > FullNameMaxLength)
            throw new ArgumentException($"Full name must not exceed {FullNameMaxLength} characters.", nameof(value));
        FullName = trimmed;
    }

    private void SetInstitution(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Institution is required.", nameof(value));
        if (trimmed.Length > InstitutionMaxLength)
            throw new ArgumentException($"Institution must not exceed {InstitutionMaxLength} characters.", nameof(value));
        Institution = trimmed;
    }

    private void SetEmail(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Email is required.", nameof(value));
        if (trimmed.Length > EmailMaxLength)
            throw new ArgumentException($"Email must not exceed {EmailMaxLength} characters.", nameof(value));
        Email = trimmed;
    }

    private void SetPhoneNumber(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Phone number is required.", nameof(value));
        if (trimmed.Length > PhoneMaxLength)
            throw new ArgumentException($"Phone number must not exceed {PhoneMaxLength} characters.", nameof(value));
        PhoneNumber = trimmed;
    }

    private void SetAddress(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Address is required.", nameof(value));
        if (trimmed.Length > AddressMaxLength)
            throw new ArgumentException($"Address must not exceed {AddressMaxLength} characters.", nameof(value));
        Address = trimmed;
    }

    private void SetNotes(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (trimmed.Length > NotesMaxLength)
            throw new ArgumentException($"Notes must not exceed {NotesMaxLength} characters.", nameof(value));
        Notes = trimmed;
    }
}
