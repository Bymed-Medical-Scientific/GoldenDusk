using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Brands;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class BrandsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateBrandRequest> _createValidator;
    private readonly IValidator<UpdateBrandRequest> _updateValidator;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;

    public BrandsController(
        IMediator mediator,
        IValidator<CreateBrandRequest> createValidator,
        IValidator<UpdateBrandRequest> updateValidator,
        IHostApplicationLifetime hostApplicationLifetime)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
        _hostApplicationLifetime = hostApplicationLifetime
            ?? throw new ArgumentNullException(nameof(hostApplicationLifetime));
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<BrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var list = await _mediator
            .Send(new GetBrandsQuery(), _hostApplicationLifetime.ApplicationStopping)
            .ConfigureAwait(false);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BrandDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator
            .Send(new GetBrandByIdQuery(id), _hostApplicationLifetime.ApplicationStopping)
            .ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(BrandDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateBrandRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _createValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(new CreateBrandCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(BrandDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBrandRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(new UpdateBrandCommand(id, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error is "Brand not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("{id:guid}/logo")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(BrandDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadLogo(Guid id, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Logo image file is required." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

        var result = await _mediator
            .Send(
                new UploadBrandLogoCommand(id, memory.ToArray(), file.FileName, file.ContentType),
                cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            return result.Error is "Brand not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteBrandCommand(id), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                "Brand not found." => NotFound(new { error = result.Error }),
                _ => BadRequest(new { error = result.Error }),
            };
        }

        return NoContent();
    }
}
