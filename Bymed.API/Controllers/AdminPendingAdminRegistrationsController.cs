using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Users;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/pending-admin-registrations")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminPendingAdminRegistrationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminPendingAdminRegistrationsController(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    /// <summary>Returns pending admin registrations waiting for approval.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PendingAdminRegistrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken)
    {
        var items = await _mediator
            .Send(new GetPendingAdminRegistrationsQuery(), cancellationToken)
            .ConfigureAwait(false);

        return Ok(items);
    }

    /// <summary>Activates an admin account that was created from the admin SPA and is waiting for approval.</summary>
    [HttpPost("{userId:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Approve(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _mediator
            .Send(new ApprovePendingAdminRegistrationCommand(userId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
