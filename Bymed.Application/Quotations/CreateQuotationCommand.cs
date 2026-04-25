using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record CreateQuotationCommand(CreateQuotationRequest Request) : IRequest<Result<QuotationDto>>;
