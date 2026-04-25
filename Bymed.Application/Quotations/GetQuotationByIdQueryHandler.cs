using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class GetQuotationByIdQueryHandler : IRequestHandler<GetQuotationByIdQuery, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;

    public GetQuotationByIdQueryHandler(IQuotationRepository quotationRepository)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
    }

    public async Task<Result<QuotationDto>> Handle(GetQuotationByIdQuery request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        return quotation is null
            ? Result<QuotationDto>.Failure("Quotation not found.")
            : Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
    }
}
