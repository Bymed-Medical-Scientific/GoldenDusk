using System.Security.Claims;
using Asp.Versioning;
using Bymed.Application.Users;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<UpdateProfileRequest> _updateProfileValidator;
    private readonly IValidator<UpsertAddressRequest> _upsertAddressValidator;

    public UsersController(
        IMediator mediator,
        IValidator<UpdateProfileRequest> updateProfileValidator,
        IValidator<UpsertAddressRequest> upsertAddressValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _updateProfileValidator = updateProfileValidator ?? throw new ArgumentNullException(nameof(updateProfileValidator));
        _upsertAddressValidator = upsertAddressValidator ?? throw new ArgumentNullException(nameof(upsertAddressValidator));
    }

    private Guid? ResolveUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userIdClaim))
            return null;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var result = await _mediator.Send(new GetUserProfileQuery(userId.Value), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var validation = await _updateProfileValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator
            .Send(new UpdateUserProfileCommand(userId.Value, request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpGet("addresses")]
    [ProducesResponseType(typeof(IReadOnlyList<UserAddressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAddresses(CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var result = await _mediator.Send(new GetUserProfileQuery(userId.Value), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value!.Addresses);
    }

    [HttpPost("addresses")]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddAddress([FromBody] UpsertAddressRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var validation = await _upsertAddressValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator
            .Send(new AddUserAddressCommand(userId.Value, request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetAddresses), result.Value);
    }

    [HttpPut("addresses/{id:guid}")]
    [ProducesResponseType(typeof(UserAddressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(Guid id, [FromBody] UpsertAddressRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var validation = await _upsertAddressValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator
            .Send(new UpdateUserAddressCommand(userId.Value, id, request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpDelete("addresses/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken cancellationToken)
    {
        var userId = ResolveUserId();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid or missing user identity." });

        var result = await _mediator
            .Send(new DeleteUserAddressCommand(userId.Value, id), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return NoContent();
    }
}
