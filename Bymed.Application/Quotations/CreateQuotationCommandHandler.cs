using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed class CreateQuotationCommandHandler : IRequestHandler<CreateQuotationCommand, Result<QuotationDto>>
{
    private readonly IQuotationRepository _quotationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateQuotationCommandHandler(IQuotationRepository quotationRepository, IUnitOfWork unitOfWork)
    {
        _quotationRepository = quotationRepository ?? throw new ArgumentNullException(nameof(quotationRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuotationDto>> Handle(CreateQuotationCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var quotationNumber = await GenerateUniqueQuotationNumberAsync(cancellationToken).ConfigureAwait(false);

        var quotation = new Quotation(
            quotationNumber,
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
            req.TermsAndConditions,
            DateTime.UtcNow);

        _quotationRepository.Add(quotation);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<QuotationDto>.Success(QuotationMappings.ToDto(quotation));
    }

    private async Task<string> GenerateUniqueQuotationNumberAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var candidate = $"Q-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
            var exists = await _quotationRepository
                .ExistsQuotationNumberAsync(candidate, null, cancellationToken)
                .ConfigureAwait(false);
            if (!exists)
                return candidate;
        }

        throw new InvalidOperationException("Unable to generate a unique quotation number.");
    }
}
