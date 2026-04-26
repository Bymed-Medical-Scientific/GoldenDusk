using Bymed.Application.Common;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed class GetCurrencyDefinitionByIdQueryHandler : IRequestHandler<GetCurrencyDefinitionByIdQuery, Result<CurrencyDefinitionDto>>
{
    private readonly ICurrencyDefinitionRepository _currencyDefinitionRepository;

    public GetCurrencyDefinitionByIdQueryHandler(ICurrencyDefinitionRepository currencyDefinitionRepository)
    {
        _currencyDefinitionRepository = currencyDefinitionRepository ?? throw new ArgumentNullException(nameof(currencyDefinitionRepository));
    }

    public async Task<Result<CurrencyDefinitionDto>> Handle(GetCurrencyDefinitionByIdQuery request, CancellationToken cancellationToken)
    {
        var currency = await _currencyDefinitionRepository.GetByIdAsync(request.CurrencyDefinitionId, cancellationToken).ConfigureAwait(false);
        return currency is null
            ? Result<CurrencyDefinitionDto>.Failure("Currency not found.")
            : Result<CurrencyDefinitionDto>.Success(CurrencyMappings.ToDto(currency));
    }
}
