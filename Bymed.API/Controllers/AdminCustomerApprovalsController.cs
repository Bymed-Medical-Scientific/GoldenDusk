using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Users;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/customer-approvals")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminCustomerApprovalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminCustomerApprovalsController(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingCustomerRegistrationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetPendingCustomerRegistrationsQuery(), cancellationToken).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost("{userId:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Approve(Guid userId, [FromQuery] bool canViewPrices = true, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ApproveCustomerRegistrationCommand(userId, canViewPrices), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpPost("{userId:guid}/decline")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Decline(Guid userId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DeclineCustomerRegistrationCommand(userId), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return NoContent();
    }

    [HttpPost("{userId:guid}/price-visibility")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetPriceVisibility(Guid userId, [FromQuery] bool canViewPrices, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new SetCustomerPriceVisibilityCommand(userId, canViewPrices), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });
        return NoContent();
    }
}
