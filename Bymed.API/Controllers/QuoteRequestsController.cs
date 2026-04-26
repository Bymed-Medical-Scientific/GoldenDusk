using Asp.Versioning;
using Bymed.Application.Quotes;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quote-requests")]
[Produces("application/json")]
[AllowAnonymous]
public sealed class QuoteRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<SubmitQuoteRequestRequest> _validator;

    public QuoteRequestsController(IMediator mediator, IValidator<SubmitQuoteRequestRequest> validator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    [HttpPost]
    [ProducesResponseType(typeof(QuoteRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit([FromBody] SubmitQuoteRequestRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _validator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(new SubmitQuoteRequestCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}
