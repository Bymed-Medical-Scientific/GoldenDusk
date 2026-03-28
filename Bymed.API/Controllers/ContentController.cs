using System.Security.Claims;
using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.PageContent;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/content")]
[Produces("application/json")]
public sealed class ContentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<UpdatePageContentRequest> _updateValidator;

    public ContentController(
        IMediator mediator,
        IValidator<UpdatePageContentRequest> updateValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    /// <summary>List all pages with pagination.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PageContentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetAllPagesQuery(pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Upload an image for CMS pages (admin only). Returns public URL for embedding.</summary>
    [HttpPost("images")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ContentImageUploadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Image file is required." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

        var command = new UploadContentImageCommand(
            memory.ToArray(),
            file.FileName,
            file.ContentType ?? "application/octet-stream");

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Created(string.Empty, result.Value);
    }

    /// <summary>List saved content snapshots for a page (admin only).</summary>
    [HttpGet("{slug}/versions")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(PagedResult<ContentVersionSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVersions(
        string slug,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetPageContentVersionsQuery(slug ?? string.Empty, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (result.Error is "Page not found.")
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>Get one version including HTML body (admin only).</summary>
    [HttpGet("{slug}/versions/{versionId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(ContentVersionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVersionDetail(
        string slug,
        Guid versionId,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetPageContentVersionDetailQuery(slug ?? string.Empty, versionId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (result.Error is "Page not found." or "Version not found.")
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>Restore page body from a snapshot; records a new version first (admin only).</summary>
    [HttpPost("{slug}/versions/{versionId:guid}/revert")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(PageContentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RevertToVersion(
        string slug,
        Guid versionId,
        CancellationToken cancellationToken = default)
    {
        var modifiedBy = ResolveModifiedBy();
        var result = await _mediator
            .Send(new RevertPageContentToVersionCommand(slug ?? string.Empty, versionId, modifiedBy), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (result.Error is "Page not found." or "Version not found.")
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>Get page content by slug.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(PageContentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetPageBySlugQuery(slug ?? string.Empty), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Update page content (admin only). Records version history.</summary>
    [HttpPut("{slug}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(PageContentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        string slug,
        [FromBody] UpdatePageContentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var modifiedBy = ResolveModifiedBy();

        var result = await _mediator
            .Send(new UpdatePageContentCommand(slug ?? string.Empty, request, modifiedBy), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            if (result.Error is "Page not found.")
                return NotFound(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    private string ResolveModifiedBy()
    {
        return User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? "admin";
    }
}
