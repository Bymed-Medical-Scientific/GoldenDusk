using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotes;

public sealed record SubmitQuoteRequestCommand(SubmitQuoteRequestRequest Request) : IRequest<Result<QuoteRequestDto>>;
