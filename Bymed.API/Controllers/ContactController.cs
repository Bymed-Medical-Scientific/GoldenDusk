using Asp.Versioning;
using Bymed.Application.Contact;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/contact")]
[Produces("application/json")]
[AllowAnonymous]
public sealed class ContactController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<SubmitContactFormRequest> _validator;

    public ContactController(
        IMediator mediator,
        IValidator<SubmitContactFormRequest> validator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ContactFormDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit([FromBody] SubmitContactFormRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _validator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator
            .Send(new SubmitContactFormCommand(request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}
