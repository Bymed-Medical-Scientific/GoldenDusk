using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed class UpdateCurrencyDefinitionCommandHandler : IRequestHandler<UpdateCurrencyDefinitionCommand, Result<CurrencyDefinitionDto>>
{
    private readonly ICurrencyDefinitionRepository _currencyDefinitionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCurrencyDefinitionCommandHandler(
        ICurrencyDefinitionRepository currencyDefinitionRepository,
        IUnitOfWork unitOfWork)
    {
        _currencyDefinitionRepository = currencyDefinitionRepository ?? throw new ArgumentNullException(nameof(currencyDefinitionRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<CurrencyDefinitionDto>> Handle(UpdateCurrencyDefinitionCommand request, CancellationToken cancellationToken)
    {
        var currency = await _currencyDefinitionRepository.GetByIdAsync(request.CurrencyDefinitionId, cancellationToken).ConfigureAwait(false);
        if (currency is null)
            return Result<CurrencyDefinitionDto>.Failure("Currency not found.");

        var req = request.Request;
        currency.Update(req.Name, req.Symbol ?? string.Empty, req.DecimalPlaces, req.IsActive);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<CurrencyDefinitionDto>.Success(CurrencyMappings.ToDto(currency));
    }
}
