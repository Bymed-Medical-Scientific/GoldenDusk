using MediatR;

namespace Bymed.Application.Quotes;

public sealed record GetQuoteRequestByIdQuery(Guid QuoteRequestId) : IRequest<QuoteRequestDto?>;
