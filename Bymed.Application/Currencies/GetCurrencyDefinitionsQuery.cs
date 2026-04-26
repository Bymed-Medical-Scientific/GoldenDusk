using MediatR;

namespace Bymed.Application.Currencies;

public sealed record GetCurrencyDefinitionsQuery : IRequest<IReadOnlyList<CurrencyDefinitionDto>>;
