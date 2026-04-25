using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record RemoveQuotationItemCommand(Guid QuotationId, Guid ItemId) : IRequest<Result<QuotationDto>>;
