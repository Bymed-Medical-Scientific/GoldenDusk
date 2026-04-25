using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Quotations;

public sealed record ExportQuotationPdfQuery(Guid QuotationId) : IRequest<Result<byte[]>>;
