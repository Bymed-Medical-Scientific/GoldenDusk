using Bymed.Domain.Entities;

namespace Bymed.Application.Quotations;

public static class QuotationMappings
{
    public static QuotationDto ToDto(Quotation quotation)
    {
        ArgumentNullException.ThrowIfNull(quotation);
        return new QuotationDto
        {
            Id = quotation.Id,
            QuotationNumber = quotation.QuotationNumber,
            Status = quotation.Status,
            CustomerName = quotation.CustomerName,
            CustomerInstitution = quotation.CustomerInstitution,
            CustomerEmail = quotation.CustomerEmail,
            CustomerPhone = quotation.CustomerPhone,
            CustomerAddress = quotation.CustomerAddress,
            Subject = quotation.Subject,
            Notes = quotation.Notes,
            TermsAndConditions = quotation.TermsAndConditions,
            TargetCurrencyCode = quotation.TargetCurrencyCode,
            VatPercent = quotation.VatPercent,
            ShowVatOnDocument = quotation.ShowVatOnDocument,
            HasPurchaseOrder = quotation.HasPurchaseOrder,
            PurchaseOrderReference = quotation.PurchaseOrderReference,
            SubtotalExcludingVat = quotation.SubtotalExcludingVat,
            VatAmount = quotation.VatAmount,
            TotalIncludingVat = quotation.TotalIncludingVat,
            CreatedAtUtc = quotation.CreatedAtUtc,
            FinalizedAtUtc = quotation.FinalizedAtUtc,
            Items = quotation.Items.Select(ToItemDto).ToList()
        };
    }

    public static QuotationSummaryDto ToSummaryDto(Quotation quotation)
    {
        ArgumentNullException.ThrowIfNull(quotation);
        return new QuotationSummaryDto
        {
            Id = quotation.Id,
            QuotationNumber = quotation.QuotationNumber,
            Status = quotation.Status,
            CustomerName = quotation.CustomerName,
            CustomerInstitution = quotation.CustomerInstitution,
            Subject = quotation.Subject,
            HasPurchaseOrder = quotation.HasPurchaseOrder,
            PurchaseOrderReference = quotation.PurchaseOrderReference,
            SubtotalExcludingVat = quotation.SubtotalExcludingVat,
            VatAmount = quotation.VatAmount,
            TotalIncludingVat = quotation.TotalIncludingVat,
            TargetCurrencyCode = quotation.TargetCurrencyCode,
            CreatedAtUtc = quotation.CreatedAtUtc,
            FinalizedAtUtc = quotation.FinalizedAtUtc
        };
    }

    private static QuotationItemDto ToItemDto(QuotationItem item) =>
        new()
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductNameSnapshot = item.ProductNameSnapshot,
            ProductSkuSnapshot = item.ProductSkuSnapshot,
            ProductImageUrlSnapshot = item.ProductImageUrlSnapshot,
            Quantity = item.Quantity,
            SupplierUnitCost = item.SupplierUnitCost,
            SourceCurrencyCode = item.SourceCurrencyCode,
            ExchangeRateToTarget = item.ExchangeRateToTarget,
            MarkupMultiplier = item.MarkupMultiplier,
            UnitPriceExcludingVat = item.UnitPriceExcludingVat,
            UnitVatAmount = item.UnitVatAmount,
            UnitPriceIncludingVat = item.UnitPriceIncludingVat,
            LineSubtotalExcludingVat = item.LineSubtotalExcludingVat,
            LineVatAmount = item.LineVatAmount,
            LineTotalIncludingVat = item.LineTotalIncludingVat
        };
}
