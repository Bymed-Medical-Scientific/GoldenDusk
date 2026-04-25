using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record GetQuotationByIdQuery(Guid QuotationId) : IRequest<Result<QuotationDto>>;
