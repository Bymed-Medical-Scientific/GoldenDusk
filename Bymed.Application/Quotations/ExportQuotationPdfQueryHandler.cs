using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class ExportQuotationPdfQueryHandler : IRequestHandler<ExportQuotationPdfQuery, Result<byte[]>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IQuotationPdfRenderer _quotationPdfRenderer;

    public ExportQuotationPdfQueryHandler(IQuotationRepository quotationRepository, IQuotationPdfRenderer quotationPdfRenderer)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _quotationPdfRenderer = quotationPdfRenderer ?? throw new ArgumentNullException(nameof(quotationPdfRenderer));
    }

    public async Task<Result<byte[]>> Handle(ExportQuotationPdfQuery request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        if (quotation is null)
            return Result<byte[]>.Failure("Quotation not found.");

        var dto = QuotationMappings.ToDto(quotation);
        return await _quotationPdfRenderer.RenderAsync(dto, cancellationToken).ConfigureAwait(false);
    }
}
