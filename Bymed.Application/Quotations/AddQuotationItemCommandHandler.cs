using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class AddQuotationItemCommandHandler : IRequestHandler<AddQuotationItemCommand, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddQuotationItemCommandHandler(IQuotationRepository quotationRepository, IUnitOfWork unitOfWork)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuotationDto>> Handle(AddQuotationItemCommand request, CancellationToken cancellationToken)
    {
        var firstAttempt = await TryAddItemAndSaveAsync(request, cancellationToken).ConfigureAwait(false);
        if (firstAttempt.IsSuccess)
            return firstAttempt;

        return firstAttempt;
    }

    private async Task<Result<QuotationDto>> TryAddItemAndSaveAsync(AddQuotationItemCommand request, CancellationToken cancellationToken)
    {
        var quotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
        if (quotation is null)
            return Result<QuotationDto>.Failure("Quotation not found.");

        var req = request.Request;
        try
        {
            quotation.AddItem(
                req.ProductId,
                req.ProductNameSnapshot,
                req.ProductSkuSnapshot,
                req.ProductImageUrlSnapshot,
                req.Quantity,
                req.SupplierUnitCost,
                req.SourceCurrencyCode,
                req.ExchangeRateToTarget,
                req.MarkupMultiplier);

            await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException || ex is ArgumentOutOfRangeException)
        {
            return Result<QuotationDto>.Failure(ex.Message);
        }
        catch (Exception ex) when (ex.GetType().Name.Equals("DbUpdateConcurrencyException", StringComparison.Ordinal))
        {
            _unitOfWork.ClearTrackedChanges();
            try
            {
                // Retry once from a fresh tracked aggregate.
                var retryQuotation = await _quotationRepository.GetByIdAsync(request.QuotationId, cancellationToken).ConfigureAwait(false);
                if (retryQuotation is null)
                    return Result<QuotationDto>.Failure("Quotation not found.");

                retryQuotation.AddItem(
                    req.ProductId,
                    req.ProductNameSnapshot,
                    req.ProductSkuSnapshot,
                    req.ProductImageUrlSnapshot,
                    req.Quantity,
                    req.SupplierUnitCost,
                    req.SourceCurrencyCode,
                    req.ExchangeRateToTarget,
                    req.MarkupMultiplier);

                await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                return Result<QuotationDto>.Success(QuotationMappings.ToDto(retryQuotation));
            }
            catch
            {
                return Result<QuotationDto>.Failure("Quotation was modified concurrently. Please try saving again.");
            }
        }
        catch (Exception ex)
        {
            return Result<QuotationDto>.Failure(ex.Message);
        }
    }
}
