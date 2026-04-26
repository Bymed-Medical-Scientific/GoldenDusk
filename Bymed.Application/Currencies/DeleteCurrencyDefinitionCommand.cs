using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed record DeleteCurrencyDefinitionCommand(Guid CurrencyDefinitionId) : IRequest<Result>;
