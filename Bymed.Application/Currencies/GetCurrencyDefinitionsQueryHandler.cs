using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed class GetCurrencyDefinitionsQueryHandler : IRequestHandler<GetCurrencyDefinitionsQuery, IReadOnlyList<CurrencyDefinitionDto>>
{
    private readonly ICurrencyDefinitionRepository _currencyDefinitionRepository;

    public GetCurrencyDefinitionsQueryHandler(ICurrencyDefinitionRepository currencyDefinitionRepository)
    {
        _currencyDefinitionRepository = currencyDefinitionRepository ?? throw new ArgumentNullException(nameof(currencyDefinitionRepository));
    }

    public async Task<IReadOnlyList<CurrencyDefinitionDto>> Handle(GetCurrencyDefinitionsQuery request, CancellationToken cancellationToken)
    {
        var currencies = await _currencyDefinitionRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return currencies.Select(CurrencyMappings.ToDto).ToList();
    }
}
