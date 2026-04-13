using Asp.Versioning;
using Bymed.Application.Currency;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class CurrencyController : ControllerBase
{
    private readonly ICurrencyService _currency;

    public CurrencyController(ICurrencyService currency)
    {
        _currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    /// <summary>Current exchange rates (USD base), cached for the configured TTL.</summary>
    [HttpGet("rates")]
    [ProducesResponseType(typeof(ExchangeRates), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GetRates(CancellationToken cancellationToken)
    {
        try
        {
            var rates = await _currency.GetExchangeRatesAsync(cancellationToken).ConfigureAwait(false);
            return Ok(rates);
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "Unable to fetch exchange rates." });
        }
    }

    /// <summary>Detect default display currency (USD or ZAR) from the caller IP.</summary>
    [HttpGet("detect")]
    [ProducesResponseType(typeof(CurrencyDetectResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Detect(CancellationToken cancellationToken)
    {
        var ip = ResolveClientIp(HttpContext);
        var currency = await _currency.DetectCurrencyAsync(ip ?? string.Empty, cancellationToken).ConfigureAwait(false);
        return Ok(new CurrencyDetectResponse(currency));
    }

    private static string? ResolveClientIp(HttpContext context)
    {
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first))
                return first.Trim();
        }

        var remote = context.Connection.RemoteIpAddress;
        if (remote is null)
            return null;

        if (remote.IsIPv4MappedToIPv6)
            remote = remote.MapToIPv4();

        return remote.ToString();
    }

    public sealed record CurrencyDetectResponse(string Currency);
}
