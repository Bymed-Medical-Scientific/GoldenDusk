using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class UpdateQuotationCommandHandler : IRequestHandler<UpdateQuotationCommand, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateQuotationCommandHandler(IQuotationRepository quotationRepository, IUnitOfWork unitOfWork)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuotationDto>> Handle(UpdateQuotationCommand request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        if (quotation is null)
            return Result<QuotationDto>.Failure("Quotation not found.");

        var req = request.Request;
        try
        {
            quotation.UpdateMetadata(
                req.CustomerName,
                req.CustomerInstitution,
                req.CustomerEmail,
                req.CustomerPhone,
                req.CustomerAddress,
                req.Subject,
                req.TargetCurrencyCode,
                req.VatPercent,
                req.ShowVatOnDocument,
                req.Notes,
                req.TermsAndConditions);
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException || ex is ArgumentOutOfRangeException)
        {
            return Result<QuotationDto>.Failure(ex.Message);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
    }
}
