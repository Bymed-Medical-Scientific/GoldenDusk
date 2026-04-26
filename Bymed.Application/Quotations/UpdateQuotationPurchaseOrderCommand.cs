using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record UpdateQuotationPurchaseOrderCommand(Guid QuotationId, UpdateQuotationPurchaseOrderRequest Request) : IRequest<Result<QuotationDto>>;
