using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record UpdateQuotationItemCommand(Guid QuotationId, Guid ItemId, UpsertQuotationItemRequest Request) : IRequest<Result<QuotationDto>>;
