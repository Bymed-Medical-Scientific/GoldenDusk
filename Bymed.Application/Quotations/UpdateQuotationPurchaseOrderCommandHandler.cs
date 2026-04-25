using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class UpdateQuotationPurchaseOrderCommandHandler : IRequestHandler<UpdateQuotationPurchaseOrderCommand, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateQuotationPurchaseOrderCommandHandler(IQuotationRepository quotationRepository, IUnitOfWork unitOfWork)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuotationDto>> Handle(UpdateQuotationPurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        if (quotation is null)
            return Result<QuotationDto>.Failure("Quotation not found.");

        try
        {
            quotation.UpdatePurchaseOrder(request.Request.HasPurchaseOrder, request.Request.PurchaseOrderReference);
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException)
        {
            return Result<QuotationDto>.Failure(ex.Message);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
    }
}
