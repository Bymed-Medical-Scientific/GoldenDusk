using Bymed.Domain.Entities;

namespace Bymed.Application.Orders;

public static class OrderNumberFormatter
{
    /// <summary>
    /// Builds <c>ORD-{sequence:0000}-{initials}-{yy-MM-dd}</c>.
    /// </summary>
    public static string Format(int dailySequence, string customerName, DateTime utcTimestamp)
    {
        if (dailySequence < 1)
            throw new ArgumentOutOfRangeException(nameof(dailySequence), "Daily sequence must be at least 1.");

        var sequence = dailySequence.ToString("D4");
        var initials = ExtractClientInitials(customerName);
        var datePart = utcTimestamp.ToString("yy-MM-dd");
        var orderNumber = $"ORD-{sequence}-{initials}-{datePart}";

        return orderNumber.Length > Order.OrderNumberMaxLength
            ? orderNumber[..Order.OrderNumberMaxLength]
            : orderNumber;
    }

    public static string ExtractClientInitials(string customerName)
    {
        if (string.IsNullOrWhiteSpace(customerName))
            return "XX";

        var parts = customerName
            .Trim()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
            return "XX";

        var initials = new string(parts.Select(p => char.ToUpperInvariant(p[0])).ToArray());
        return initials.Length > 4 ? initials[..4] : initials;
    }
}
