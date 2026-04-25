using Bymed.API.Authorization;
using Bymed.Application.Contact;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[Asp.Versioning.ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/contact-notification-recipients")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminContactNotificationRecipientsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateContactNotificationRecipientRequest> _validator;

    public AdminContactNotificationRecipientsController(
        IMediator mediator,
        IValidator<CreateContactNotificationRecipientRequest> validator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ContactNotificationRecipientDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetContactNotificationRecipientsQuery(), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ContactNotificationRecipientDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateContactNotificationRecipientRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _validator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator
            .Send(new CreateContactNotificationRecipientCommand(request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpDelete("{recipientId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Deactivate(Guid recipientId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new DeactivateContactNotificationRecipientCommand(recipientId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    [HttpPost("{recipientId:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Activate(Guid recipientId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new ActivateContactNotificationRecipientCommand(recipientId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
