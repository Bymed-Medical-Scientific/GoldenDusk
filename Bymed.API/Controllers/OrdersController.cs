using System.Security.Claims;
using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Orders;
using Bymed.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateOrderRequest> _createValidator;
    private readonly IValidator<UpdateOrderStatusRequest> _updateValidator;

    public OrdersController(
        IMediator mediator,
        IValidator<CreateOrderRequest> createValidator,
        IValidator<UpdateOrderStatusRequest> updateValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    private (Guid? UserId, bool IsAdmin) ResolveUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var isAdmin = User.IsInRole("Admin");
        Guid? userId = null;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsed))
            userId = parsed;
        return (userId, isAdmin);
    }

    /// <summary>Create order (checkout) from cart.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var (userId, _) = ResolveUser();
        var sessionId = Request.Cookies["cart_session_id"];

        var req = request with
        {
            UserId = userId ?? request.UserId,
            SessionId = request.SessionId ?? sessionId
        };

        var validation = await _createValidator.ValidateAsync(req, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new ProcessOrderCommand(req), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Get current user's orders.</summary>
    [HttpGet("my-orders")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResult<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var (userId, _) = ResolveUser();
        if (!userId.HasValue)
            return Unauthorized();

        var result = await _mediator
            .Send(new GetUserOrdersQuery(userId.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Get order by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var (userId, isAdmin) = ResolveUser();
        var result = await _mediator
            .Send(new GetOrderByIdQuery(id, userId ?? Guid.Empty, isAdmin), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Update order status (admin only).</summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new UpdateOrderStatusCommand(id, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return result.Error is "Order not found." ? NotFound(new { error = result.Error }) : BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Get all orders with filtering (admin only).</summary>
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(PagedResult<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetAllOrdersQuery(pageNumber, pageSize, status, dateFrom, dateTo), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Get order analytics (admin only).</summary>
    [HttpGet("analytics")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(OrderAnalyticsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetOrderAnalyticsQuery(dateFrom, dateTo), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Export orders as CSV (admin only).</summary>
    [HttpGet("export")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [Produces("text/csv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(
        [FromQuery] OrderStatus? status = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var lines = await _mediator
            .Send(new ExportOrdersQuery(status, dateFrom, dateTo), cancellationToken)
            .ConfigureAwait(false);

        return new StreamWriterResult(lines, cancellationToken);
    }
}

internal sealed class StreamWriterResult : IActionResult
{
    private readonly IAsyncEnumerable<string> _lines;
    private readonly CancellationToken _cancellationToken;

    public StreamWriterResult(IAsyncEnumerable<string> lines, CancellationToken cancellationToken)
    {
        _lines = lines ?? throw new ArgumentNullException(nameof(lines));
        _cancellationToken = cancellationToken;
    }

    public async Task ExecuteResultAsync(ActionContext context)
    {
        var response = context.HttpContext.Response;
        response.ContentType = "text/csv";
        response.Headers.Append("Content-Disposition", "attachment; filename=\"orders.csv\"");

        await using var writer = new StreamWriter(response.Body, leaveOpen: true);
        await foreach (var line in _lines.WithCancellation(_cancellationToken))
        {
            await writer.WriteLineAsync(line).ConfigureAwait(false);
        }
    }
}
