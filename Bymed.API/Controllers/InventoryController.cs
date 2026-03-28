using System.Security.Claims;
using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Inventory;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public sealed class InventoryController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<AdjustInventoryRequest> _adjustValidator;

    public InventoryController(IMediator mediator, IValidator<AdjustInventoryRequest> adjustValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _adjustValidator = adjustValidator ?? throw new ArgumentNullException(nameof(adjustValidator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<InventoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] bool lowStockOnly = false,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetInventoryQuery(pageNumber, pageSize, lowStockOnly, search), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStock(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetLowStockProductsQuery(), cancellationToken).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("history/{productId:guid}")]
    [ProducesResponseType(typeof(PagedResult<InventoryLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        Guid productId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetInventoryHistoryQuery(productId, pageNumber, pageSize, dateFrom, dateTo), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost("adjust")]
    [ProducesResponseType(typeof(InventoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Adjust(
        [FromQuery] Guid productId,
        [FromBody] AdjustInventoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (productId == Guid.Empty)
            return BadRequest(new { error = "ProductId is required." });

        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _adjustValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var changedBy = ResolveChangedBy();
        var result = await _mediator
            .Send(new AdjustInventoryCommand(productId, request, changedBy), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            return result.Error is "Product not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    private string ResolveChangedBy()
    {
        return User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? "admin";
    }
}
