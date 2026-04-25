using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record AddQuotationItemCommand(Guid QuotationId, UpsertQuotationItemRequest Request) : IRequest<Result<QuotationDto>>;
