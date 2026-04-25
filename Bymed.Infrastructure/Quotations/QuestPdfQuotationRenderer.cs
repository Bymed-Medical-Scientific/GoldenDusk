using Bymed.Application.Common;
using Bymed.Application.Quotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Bymed.Infrastructure.Quotations;

public sealed class QuestPdfQuotationRenderer : IQuotationPdfRenderer
{
    public Task<Result<byte[]>> RenderAsync(QuotationDto quotation, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(quotation);

        try
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var bytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(24);
                    page.Size(PageSizes.A4);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(column =>
                    {
                        column.Item().Text("Bymed").FontSize(18).SemiBold();
                        column.Item().Text($"Quotation: {quotation.QuotationNumber}");
                        column.Item().Text($"Date: {quotation.CreatedAtUtc:dd MMM yyyy}");
                        column.Item().Text($"Subject: {quotation.Subject}");
                    });

                    page.Content().PaddingVertical(12).Column(column =>
                    {
                        column.Item().Text($"To: {quotation.CustomerInstitution}").SemiBold();
                        column.Item().Text($"Contact: {quotation.CustomerName}");
                        column.Item().Text($"Email: {quotation.CustomerEmail}");
                        column.Item().Text($"Phone: {quotation.CustomerPhone}");
                        column.Item().Text($"Address: {quotation.CustomerAddress}");
                        column.Item().PaddingVertical(8).LineHorizontal(1);

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(4);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Description").SemiBold();
                                header.Cell().AlignRight().Text("Qty").SemiBold();
                                header.Cell().AlignRight().Text("Unit Price").SemiBold();
                                header.Cell().AlignRight().Text("Total").SemiBold();
                            });

                            foreach (var item in quotation.Items)
                            {
                                table.Cell().Text(item.ProductNameSnapshot);
                                table.Cell().AlignRight().Text(item.Quantity.ToString());
                                table.Cell().AlignRight().Text($"{quotation.TargetCurrencyCode} {item.UnitPriceIncludingVat:N2}");
                                table.Cell().AlignRight().Text($"{quotation.TargetCurrencyCode} {item.LineTotalIncludingVat:N2}");
                            }
                        });

                        column.Item().PaddingTop(8).AlignRight().Column(totals =>
                        {
                            totals.Item().Text($"Sub-total: {quotation.TargetCurrencyCode} {quotation.SubtotalExcludingVat:N2}");
                            if (quotation.ShowVatOnDocument)
                                totals.Item().Text($"VAT ({quotation.VatPercent:N1}%): {quotation.TargetCurrencyCode} {quotation.VatAmount:N2}");
                            totals.Item().Text($"Total: {quotation.TargetCurrencyCode} {quotation.TotalIncludingVat:N2}").SemiBold();
                        });

                        if (!string.IsNullOrWhiteSpace(quotation.TermsAndConditions))
                        {
                            column.Item().PaddingTop(8).Text("Terms & Conditions").SemiBold();
                            column.Item().Text(quotation.TermsAndConditions);
                        }
                    });

                    page.Footer().AlignCenter().Text("www.bymed.co.zw");
                });
            }).GeneratePdf();

            return Task.FromResult(Result<byte[]>.Success(bytes));
        }
        catch (Exception ex)
        {
            return Task.FromResult(Result<byte[]>.Failure($"Failed to render quotation PDF: {ex.Message}"));
        }
    }
}
