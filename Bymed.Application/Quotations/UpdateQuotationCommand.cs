using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record UpdateQuotationCommand(Guid QuotationId, UpdateQuotationRequest Request) : IRequest<Result<QuotationDto>>;
