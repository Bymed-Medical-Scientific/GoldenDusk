using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record FinalizeQuotationCommand(Guid QuotationId) : IRequest<Result<QuotationDto>>;
