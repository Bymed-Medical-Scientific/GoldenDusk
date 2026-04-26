using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed record UpdateCurrencyDefinitionCommand(Guid CurrencyDefinitionId, UpdateCurrencyDefinitionRequest Request) : IRequest<Result<CurrencyDefinitionDto>>;
