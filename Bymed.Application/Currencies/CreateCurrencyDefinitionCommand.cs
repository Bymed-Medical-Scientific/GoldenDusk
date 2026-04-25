using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed record CreateCurrencyDefinitionCommand(CreateCurrencyDefinitionRequest Request) : IRequest<Result<CurrencyDefinitionDto>>;
