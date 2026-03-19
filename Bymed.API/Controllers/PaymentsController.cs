using System.Text;
using Asp.Versioning;
using Bymed.Application.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class PaymentsController : ControllerBase
{
    private readonly IPaymentService _payments;

    public PaymentsController(IPaymentService payments)
    {
        _payments = payments ?? throw new ArgumentNullException(nameof(payments));
    }

    [HttpPost("initiate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var result = await _payments
            .InitiatePaymentAsync(request.Amount, request.Currency ?? "USD", request.Reference, cancellationToken)
            .ConfigureAwait(false);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage ?? "Failed to initiate payment." });

        return Ok(result);
    }

    [HttpPost("confirm")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Confirm([FromBody] ConfirmPaymentRequest request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Reference))
            return BadRequest(new { error = "Reference is required." });

        var result = await _payments.ConfirmPaymentAsync(request.Reference, cancellationToken).ConfigureAwait(false);
        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage ?? "Payment not successful.", status = result.Status.ToString() });

        return Ok(result);
    }

    // PayNow callbacks (x-www-form-urlencoded)
    [HttpPost("webhook")]
    [AllowAnonymous]
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

        var result = await _payments
            .HandleWebhookAsync(new PayNowWebhookEvent { Fields = fields, RawBody = raw }, cancellationToken)
            .ConfigureAwait(false);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage ?? "Webhook rejected." });

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

    public sealed record InitiatePaymentRequest(decimal Amount, string Reference, string? Currency);
    public sealed record ConfirmPaymentRequest(string Reference);
}

