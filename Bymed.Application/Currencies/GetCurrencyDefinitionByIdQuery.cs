using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed record GetCurrencyDefinitionByIdQuery(Guid CurrencyDefinitionId) : IRequest<Result<CurrencyDefinitionDto>>;
