using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Quotes;

public sealed class GetQuoteRequestByIdQueryHandler : IRequestHandler<GetQuoteRequestByIdQuery, QuoteRequestDto?>
{
    private readonly IQuoteRequestRepository _quoteRequestRepository;

    public GetQuoteRequestByIdQueryHandler(IQuoteRequestRepository quoteRequestRepository)
    {
        _quoteRequestRepository = quoteRequestRepository ?? throw new ArgumentNullException(nameof(quoteRequestRepository));
    }

    public async Task<QuoteRequestDto?> Handle(GetQuoteRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var quoteRequest = await _quoteRequestRepository.GetByIdAsync(request.QuoteRequestId, cancellationToken).ConfigureAwait(false);
        if (quoteRequest is null)
            return null;

        return new QuoteRequestDto
        {
            Id = quoteRequest.Id,
            FullName = quoteRequest.FullName,
            Institution = quoteRequest.Institution,
            Email = quoteRequest.Email,
            PhoneNumber = quoteRequest.PhoneNumber,
            Address = quoteRequest.Address,
            Notes = quoteRequest.Notes,
            Status = quoteRequest.Status,
            SubmittedAtUtc = quoteRequest.SubmittedAtUtc,
            Items = quoteRequest.Items.Select(i => new QuoteRequestItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductNameSnapshot,
                ProductSku = i.ProductSkuSnapshot,
                Quantity = i.Quantity
            }).ToList()
        };
    }
}
