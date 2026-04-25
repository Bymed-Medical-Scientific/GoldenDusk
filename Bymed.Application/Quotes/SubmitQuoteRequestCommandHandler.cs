using Bymed.Application.Common;
using Bymed.Application.Notifications;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Quotes;

public sealed class SubmitQuoteRequestCommandHandler : IRequestHandler<SubmitQuoteRequestCommand, Result<QuoteRequestDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IQuoteRequestRepository _quoteRequestRepository;
    private readonly IQuoteNotificationRecipientRepository _quoteNotificationRecipientRepository;
    private readonly IEmailService _emailService;
    private readonly IUnitOfWork _unitOfWork;

    public SubmitQuoteRequestCommandHandler(
        IProductRepository productRepository,
        IQuoteRequestRepository quoteRequestRepository,
        IQuoteNotificationRecipientRepository quoteNotificationRecipientRepository,
        IEmailService emailService,
        IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _quoteRequestRepository = quoteRequestRepository ?? throw new ArgumentNullException(nameof(quoteRequestRepository));
        _quoteNotificationRecipientRepository = quoteNotificationRecipientRepository ?? throw new ArgumentNullException(nameof(quoteNotificationRecipientRepository));
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<QuoteRequestDto>> Handle(SubmitQuoteRequestCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request;
        var quote = new QuoteRequest(
            payload.FullName,
            payload.Institution,
            payload.Email,
            payload.PhoneNumber,
            payload.Address,
            payload.Notes ?? string.Empty,
            DateTime.UtcNow);

        foreach (var item in payload.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken).ConfigureAwait(false);
            if (product is null || product.IsDeleted)
                return Result<QuoteRequestDto>.Failure($"Product {item.ProductId} was not found.");

            quote.AddItem(item.ProductId, product.Name, product.Sku ?? string.Empty, item.Quantity);
        }

        _quoteRequestRepository.Add(quote);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var configuredRecipients = await _quoteNotificationRecipientRepository.GetActiveAsync(cancellationToken).ConfigureAwait(false);
        var toRecipients = configuredRecipients.Where(x => x.IsPrimaryRecipient).Select(x => x.Email).ToList();
        var ccRecipients = configuredRecipients.Where(x => !x.IsPrimaryRecipient).Select(x => x.Email).ToList();
        if (toRecipients.Count == 0)
            toRecipients.Add("info@bymed.co.zw");

        await _emailService.SendQuoteRequestSubmittedEmailAsync(
            quote.Id,
            quote.FullName,
            quote.Institution,
            quote.Email,
            quote.PhoneNumber,
            quote.Address,
            quote.Notes,
            quote.Items.Select(i => (i.ProductNameSnapshot, i.ProductSkuSnapshot, i.Quantity)).ToList(),
            toRecipients,
            ccRecipients,
            cancellationToken).ConfigureAwait(false);

        return Result<QuoteRequestDto>.Success(new QuoteRequestDto
        {
            Id = quote.Id,
            FullName = quote.FullName,
            Institution = quote.Institution,
            Email = quote.Email,
            PhoneNumber = quote.PhoneNumber,
            Address = quote.Address,
            Notes = quote.Notes,
            Status = quote.Status,
            SubmittedAtUtc = quote.SubmittedAtUtc,
            Items = quote.Items.Select(i => new QuoteRequestItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductNameSnapshot,
                ProductSku = i.ProductSkuSnapshot,
                Quantity = i.Quantity
            }).ToList()
        });
    }
}
