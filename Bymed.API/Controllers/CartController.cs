using System.Security.Claims;
using Asp.Versioning;
using Bymed.Application.Carts;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class CartController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<AddToCartRequest> _addToCartValidator;

    public CartController(IMediator mediator, IValidator<AddToCartRequest> addToCartValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _addToCartValidator = addToCartValidator ?? throw new ArgumentNullException(nameof(addToCartValidator));
    }

    private (Guid? UserId, string? SessionId) ResolveCartIdentity()
    {
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsed))
            userId = parsed;

        if (userId is not null)
            return (userId, null);

        var sessionId = Request.Cookies["cart_session_id"];
        if (!string.IsNullOrWhiteSpace(sessionId))
            return (null, sessionId);

        // For guests with no cookie yet, generate a new opaque session id and set cookie.
        sessionId = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(
            "cart_session_id",
            sessionId,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                IsEssential = true,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

        return (null, sessionId);
    }

    /// <summary>Get the current shopping cart for the authenticated user or guest session.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart(CancellationToken cancellationToken)
    {
        var (userId, sessionId) = ResolveCartIdentity();
        var result = await _mediator
            .Send(new GetCartQuery(userId, sessionId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // Represent "no cart yet" as an empty cart payload rather than null.
        if (result.Value is null)
        {
            return Ok(new CartDto
            {
                Id = Guid.Empty,
                UserId = userId,
                SessionId = sessionId,
                Items = Array.Empty<CartItemDto>(),
                TotalItems = 0,
                Total = 0m
            });
        }

        return Ok(result.Value);
    }

    /// <summary>Add an item to the cart or increase its quantity.</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _addToCartValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var (userId, sessionId) = ResolveCartIdentity();

        var result = await _mediator
            .Send(new AddToCartCommand(userId, sessionId, request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Update the quantity of a cart item.</summary>
    [HttpPut("items/{productId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateItem(Guid productId, [FromBody] int quantity, CancellationToken cancellationToken)
    {
        if (quantity <= 0)
            return BadRequest(new { error = "Quantity must be greater than zero." });

        var (userId, sessionId) = ResolveCartIdentity();

        var result = await _mediator
            .Send(new UpdateCartItemCommand(userId, sessionId, productId, quantity), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Remove an item from the cart.</summary>
    [HttpDelete("items/{productId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveItem(Guid productId, CancellationToken cancellationToken)
    {
        var (userId, sessionId) = ResolveCartIdentity();

        var result = await _mediator
            .Send(new RemoveCartItemCommand(userId, sessionId, productId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Clear the entire cart.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ClearCart(CancellationToken cancellationToken)
    {
        var (userId, sessionId) = ResolveCartIdentity();

        var result = await _mediator
            .Send(new ClearCartCommand(userId, sessionId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}

