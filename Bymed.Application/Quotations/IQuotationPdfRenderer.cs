using Bymed.Application.Common;

namespace Bymed.Application.Quotations;

public interface IQuotationPdfRenderer
{
    Task<Result<byte[]>> RenderAsync(QuotationDto quotation, CancellationToken cancellationToken = default);
}
