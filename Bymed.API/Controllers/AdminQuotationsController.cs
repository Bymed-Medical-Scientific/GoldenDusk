using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Quotations;
using Bymed.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/quotations")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminQuotationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateQuotationRequest> _createValidator;
    private readonly IValidator<UpdateQuotationRequest> _updateValidator;
    private readonly IValidator<UpsertQuotationItemRequest> _itemValidator;
    private readonly IValidator<UpdateQuotationPurchaseOrderRequest> _purchaseOrderValidator;

    public AdminQuotationsController(
        IMediator mediator,
        IValidator<CreateQuotationRequest> createValidator,
        IValidator<UpdateQuotationRequest> updateValidator,
        IValidator<UpsertQuotationItemRequest> itemValidator,
        IValidator<UpdateQuotationPurchaseOrderRequest> purchaseOrderValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
        _itemValidator = itemValidator ?? throw new ArgumentNullException(nameof(itemValidator));
        _purchaseOrderValidator = purchaseOrderValidator ?? throw new ArgumentNullException(nameof(purchaseOrderValidator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<QuotationSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] QuotationStatus? status = null,
        [FromQuery] bool? hasPurchaseOrder = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetQuotationsQuery(page, pageSize, status, hasPurchaseOrder, search), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("{quotationId:guid}")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid quotationId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetQuotationByIdQuery(quotationId), cancellationToken).ConfigureAwait(false);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    [HttpPost]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateQuotationRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await _createValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator.Send(new CreateQuotationCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetById), new { quotationId = result.Value!.Id }, result.Value);
    }

    [HttpPut("{quotationId:guid}")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid quotationId, [FromBody] UpdateQuotationRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator.Send(new UpdateQuotationCommand(quotationId, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpPost("{quotationId:guid}/items")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem(Guid quotationId, [FromBody] UpsertQuotationItemRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await _itemValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator.Send(new AddQuotationItemCommand(quotationId, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpPut("{quotationId:guid}/items/{itemId:guid}")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateItem(
        Guid quotationId,
        Guid itemId,
        [FromBody] UpsertQuotationItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await _itemValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator
            .Send(new UpdateQuotationItemCommand(quotationId, itemId, request), cancellationToken)
            .ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpDelete("{quotationId:guid}/items/{itemId:guid}")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(Guid quotationId, Guid itemId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new RemoveQuotationItemCommand(quotationId, itemId), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpPost("{quotationId:guid}/finalize")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Finalize(Guid quotationId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new FinalizeQuotationCommand(quotationId), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpPatch("{quotationId:guid}/purchase-order")]
    [ProducesResponseType(typeof(QuotationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePurchaseOrder(
        Guid quotationId,
        [FromBody] UpdateQuotationPurchaseOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await _purchaseOrderValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator
            .Send(new UpdateQuotationPurchaseOrderCommand(quotationId, request), cancellationToken)
            .ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpGet("{quotationId:guid}/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportPdf(Guid quotationId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ExportQuotationPdfQuery(quotationId), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Quotation not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return File(result.Value!, "application/pdf", $"quotation-{quotationId:N}.pdf");
    }
}
