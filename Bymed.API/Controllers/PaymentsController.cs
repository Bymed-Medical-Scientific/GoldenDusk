using System.Security.Claims;
using System.Text;
using Asp.Versioning;
using Bymed.Application.Payments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IPaymentService _payments;

    public PaymentsController(IMediator mediator, IPaymentService payments)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _payments = payments ?? throw new ArgumentNullException(nameof(payments));
    }

    private (Guid? UserId, string? SessionId) ResolvePayerIdentity()
    {
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsed))
            userId = parsed;

        if (userId is not null)
            return (userId, null);

        var sessionId = Request.Cookies["cart_session_id"];
        return (null, string.IsNullOrWhiteSpace(sessionId) ? null : sessionId.Trim());
    }

    /// <summary>Start PayNow checkout for an existing order (amount and reference come from the server-side order).</summary>
    [HttpPost("orders/{orderId:guid}/initiate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> InitiateForOrder(Guid orderId, CancellationToken cancellationToken)
    {
        var (userId, sessionId) = ResolvePayerIdentity();
        var result = await _mediator
            .Send(new InitiatePaymentForOrderCommand(orderId, userId, sessionId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (string.Equals(result.Error, "Order not found.", StringComparison.Ordinal))
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        var initiation = result.Value!;
        if (!initiation.Success)
            return BadRequest(new { error = initiation.ErrorMessage ?? "Failed to initiate payment." });

        return Ok(initiation);
    }

    /// <summary>Poll PayNow status for an order the caller owns.</summary>
    [HttpPost("orders/{orderId:guid}/confirm")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmForOrder(Guid orderId, CancellationToken cancellationToken)
    {
        var (userId, sessionId) = ResolvePayerIdentity();
        var result = await _mediator
            .Send(new ConfirmPaymentForOrderCommand(orderId, userId, sessionId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (string.Equals(result.Error, "Order not found.", StringComparison.Ordinal))
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        var confirm = result.Value!;
        if (!confirm.Success)
            return BadRequest(new { error = confirm.ErrorMessage ?? "Payment not successful.", status = confirm.Status.ToString() });

        return Ok(confirm);
    }

    // PayNow callbacks (x-www-form-urlencoded)
    [HttpPost("webhook")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Webhook(CancellationToken cancellationToken)
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var raw = await reader.ReadToEndAsync(cancellationToken).ConfigureAwait(false);
        Request.Body.Position = 0;

        var fields = ParsePostStyleBody(raw);
        if (fields.Count == 0)
            return BadRequest(new { error = "Invalid payload." });

        var webhookResult = await _payments
            .HandleWebhookAsync(new PayNowWebhookEvent { Fields = fields, RawBody = raw }, cancellationToken)
            .ConfigureAwait(false);

        if (!webhookResult.Success)
            return BadRequest(new { error = webhookResult.ErrorMessage ?? "Webhook rejected." });

        return Ok(new { ok = true });
    }

    private static Dictionary<string, string> ParsePostStyleBody(string body)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(body))
            return dict;

        foreach (var pair in body.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var idx = pair.IndexOf('=');
            if (idx <= 0)
                continue;
            var key = pair[..idx];
            var val = pair[(idx + 1)..];
            dict[key] = Uri.UnescapeDataString(val.Replace("+", " ", StringComparison.Ordinal));
        }

        return dict;
    }
}
