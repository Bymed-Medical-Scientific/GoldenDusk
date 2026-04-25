using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class UpdateQuotationItemCommandHandler : IRequestHandler<UpdateQuotationItemCommand, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateQuotationItemCommandHandler(IQuotationRepository quotationRepository, IUnitOfWork unitOfWork)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuotationDto>> Handle(UpdateQuotationItemCommand request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        if (quotation is null)
            return Result<QuotationDto>.Failure("Quotation not found.");

        var req = request.Request;
        try
        {
            quotation.UpdateItem(
                request.ItemId,
                req.Quantity,
                req.SupplierUnitCost,
                req.SourceCurrencyCode,
                req.ExchangeRateToTarget,
                req.MarkupMultiplier);
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException || ex is ArgumentOutOfRangeException)
        {
            return Result<QuotationDto>.Failure(ex.Message);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
    }
}
