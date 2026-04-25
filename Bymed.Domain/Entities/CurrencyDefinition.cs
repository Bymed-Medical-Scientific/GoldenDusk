using Bymed.Domain.Primitives;

namespace Bymed.Domain.Entities;

public sealed class CurrencyDefinition : BaseEntity
{
    public const int CodeMaxLength = 3;
    public const int NameMaxLength = 100;
    public const int SymbolMaxLength = 10;

    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Symbol { get; private set; } = string.Empty;
    public int DecimalPlaces { get; private set; } = 2;
    public bool IsActive { get; private set; } = true;

    private CurrencyDefinition() { }

    public CurrencyDefinition(string code, string name, string symbol, int decimalPlaces, bool isActive = true)
    {
        SetCode(code);
        SetName(name);
        SetSymbol(symbol);
        SetDecimalPlaces(decimalPlaces);
        IsActive = isActive;
    }

    public void Update(string name, string symbol, int decimalPlaces, bool isActive)
    {
        SetName(name);
        SetSymbol(symbol);
        SetDecimalPlaces(decimalPlaces);
        IsActive = isActive;
    }

    private void SetCode(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var normalized = value.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new ArgumentException("Currency code is required.", nameof(value));
        if (normalized.Length > CodeMaxLength)
            throw new ArgumentException($"Currency code must not exceed {CodeMaxLength} characters.", nameof(value));
        Code = normalized;
    }

    private void SetName(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
            throw new ArgumentException("Currency name is required.", nameof(value));
        if (trimmed.Length > NameMaxLength)
            throw new ArgumentException($"Currency name must not exceed {NameMaxLength} characters.", nameof(value));
        Name = trimmed;
    }

    private void SetSymbol(string value)
    {
        var trimmed = (value ?? string.Empty).Trim();
        if (trimmed.Length > SymbolMaxLength)
            throw new ArgumentException($"Currency symbol must not exceed {SymbolMaxLength} characters.", nameof(value));
        Symbol = trimmed;
    }

    private void SetDecimalPlaces(int value)
    {
        if (value is < 0 or > 6)
            throw new ArgumentOutOfRangeException(nameof(value), "Currency decimal places must be between 0 and 6.");
        DecimalPlaces = value;
    }
}
