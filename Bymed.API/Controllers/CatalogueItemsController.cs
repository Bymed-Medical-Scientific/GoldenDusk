using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.CatalogueItems;
using Bymed.Application.Common;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/catalogue-items")]
[Produces("application/json")]
public sealed class CatalogueItemsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateCatalogueItemRequest> _createValidator;
    private readonly IValidator<UpdateCatalogueItemRequest> _updateValidator;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;

    public CatalogueItemsController(
        IMediator mediator,
        IValidator<CreateCatalogueItemRequest> createValidator,
        IValidator<UpdateCatalogueItemRequest> updateValidator,
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
    [ProducesResponseType(typeof(PagedResult<CatalogueItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? brand = null,
        [FromQuery] bool? isPublished = null)
    {
        var effectivePublished = ResolvePublishedFilter(isPublished);
        var query = new GetCatalogueItemsQuery(
            pageNumber,
            pageSize,
            categoryId,
            search,
            brand,
            effectivePublished);

        var result = await _mediator
            .Send(query, _hostApplicationLifetime.ApplicationStopping)
            .ConfigureAwait(false);

        return Ok(result);
    }

    [HttpGet("by-slug/{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CatalogueItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var result = await _mediator
            .Send(new GetCatalogueItemBySlugQuery(slug ?? string.Empty), _hostApplicationLifetime.ApplicationStopping)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        var item = result.Value!;
        if (!item.IsPublished && !User.IsInRole("Admin"))
            return NotFound(new { error = "Catalogue item not found." });

        return Ok(item);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CatalogueItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator
            .Send(new GetCatalogueItemByIdQuery(id), _hostApplicationLifetime.ApplicationStopping)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        var item = result.Value!;
        if (!item.IsPublished && !User.IsInRole("Admin"))
            return NotFound(new { error = "Catalogue item not found." });

        return Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(CatalogueItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCatalogueItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _createValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new CreateCatalogueItemCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(CatalogueItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCatalogueItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new UpdateCatalogueItemCommand(id, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error is "Catalogue item not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteCatalogueItemCommand(id), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error is "Catalogue item not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(CatalogueItemImageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(
        Guid id,
        IFormFile? file,
        [FromForm] string? altText,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Image file is required." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

        var command = new UploadCatalogueItemImageCommand(
            id,
            memory.ToArray(),
            file.FileName,
            file.ContentType,
            altText);

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId, CancellationToken cancellationToken)
    {
        var result = await _mediator
            .Send(new DeleteCatalogueItemImageCommand(id, imageId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            return result.Error is "Catalogue item image not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    private bool? ResolvePublishedFilter(bool? isPublished)
    {
        if (!User.IsInRole("Admin"))
            return true;

        return isPublished;
    }
}
