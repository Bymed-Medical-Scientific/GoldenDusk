using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Bymed.Tests;

public sealed class QuotationWorkflowTests
{
    [Fact]
    public void FinalizedQuotation_AllowsPurchaseOrderUpdate_WithReference()
    {
        var quotation = CreateQuotation();
        quotation.AddItem(Guid.NewGuid(), "Item A", "SKU-1", null, 2, 10m, "GBP", 1.25m, 2.0m);
        quotation.Finalize(DateTime.UtcNow);

        quotation.UpdatePurchaseOrder(true, "PO-12345");

        quotation.HasPurchaseOrder.Should().BeTrue();
        quotation.PurchaseOrderReference.Should().Be("PO-12345");
        quotation.Status.Should().Be(QuotationStatus.Finalized);
    }

    [Fact]
    public void DraftQuotation_RejectsPurchaseOrderUpdate()
    {
        var quotation = CreateQuotation();

        var action = () => quotation.UpdatePurchaseOrder(true, "PO-123");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("Purchase order can only be updated for finalized quotations.");
    }

    private static Quotation CreateQuotation() =>
        new(
            "Q-20260425-1234",
            "John Doe",
            "ZERA",
            "john@example.com",
            "+263700000000",
            "Harare",
            "Trogon Cable Security Seals",
            "USD",
            15.5m,
            true,
            null,
            "Payment: COD",
            DateTime.UtcNow);
}
