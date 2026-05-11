using System.Security.Claims;
using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Marketing;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/marketing-campaigns")]
[Produces("application/json")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public sealed class MarketingCampaignsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateMarketingCampaignCommand> _createValidator;
    private readonly IValidator<AddMarketingCampaignAttachmentsCommand> _attachmentsValidator;
    private readonly IValidator<StartMarketingCampaignCommand> _startValidator;
    private readonly IValidator<GetMarketingCampaignPreviewQuery> _previewValidator;
    private readonly IValidator<GetMarketingCampaignStatusQuery> _statusValidator;

    public MarketingCampaignsController(
        IMediator mediator,
        IValidator<CreateMarketingCampaignCommand> createValidator,
        IValidator<AddMarketingCampaignAttachmentsCommand> attachmentsValidator,
        IValidator<StartMarketingCampaignCommand> startValidator,
        IValidator<GetMarketingCampaignPreviewQuery> previewValidator,
        IValidator<GetMarketingCampaignStatusQuery> statusValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _attachmentsValidator = attachmentsValidator ?? throw new ArgumentNullException(nameof(attachmentsValidator));
        _startValidator = startValidator ?? throw new ArgumentNullException(nameof(startValidator));
        _previewValidator = previewValidator ?? throw new ArgumentNullException(nameof(previewValidator));
        _statusValidator = statusValidator ?? throw new ArgumentNullException(nameof(statusValidator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MarketingCampaignListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] int take = 30, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ListMarketingCampaignsQuery(take), cancellationToken).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MarketingCampaignDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMarketingCampaignApiRequest body, CancellationToken cancellationToken)
    {
        if (body is null)
            return BadRequest(new { error = "Invalid request." });

        var userId = ParseUserId();
        var command = new CreateMarketingCampaignCommand(
            body.Subject,
            body.HtmlBody,
            body.ClientTypeIds,
            body.IncludeInstitutionEmails,
            body.IncludeContactPerson1Email,
            body.IncludeContactPerson2Email,
            userId);

        var validation = await _createValidator.ValidateAsync(command, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetStatus), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{id:guid}/attachments")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddAttachments(
        Guid id,
        [FromForm] List<IFormFile>? files,
        CancellationToken cancellationToken)
    {
        if (files is null || files.Count == 0)
            return BadRequest(new { error = "At least one file is required." });

        var filePayloads = new List<MarketingAttachmentFile>();
        foreach (var file in files)
        {
            if (file.Length == 0)
                continue;
            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken).ConfigureAwait(false);
            filePayloads.Add(new MarketingAttachmentFile(file.FileName, file.ContentType ?? "application/octet-stream", ms.ToArray()));
        }

        if (filePayloads.Count == 0)
            return BadRequest(new { error = "No non-empty files were uploaded." });

        var command = new AddMarketingCampaignAttachmentsCommand(id, filePayloads);
        var validation = await _attachmentsValidator.ValidateAsync(command, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { added = filePayloads.Count });
    }

    [HttpGet("{id:guid}/preview")]
    [ProducesResponseType(typeof(MarketingCampaignPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPreview(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetMarketingCampaignPreviewQuery(id);
        var validation = await _previewValidator.ValidateAsync(query, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(query, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("{id:guid}/start")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Start(Guid id, CancellationToken cancellationToken)
    {
        var command = new StartMarketingCampaignCommand(id);
        var validation = await _startValidator.ValidateAsync(command, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(new { started = true });
    }

    [HttpGet("{id:guid}/status")]
    [ProducesResponseType(typeof(MarketingCampaignStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStatus(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetMarketingCampaignStatusQuery(id);
        var validation = await _statusValidator.ValidateAsync(query, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }) });

        var result = await _mediator.Send(query, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    private Guid? ParseUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}

public sealed class CreateMarketingCampaignApiRequest
{
    public string Subject { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public List<Guid> ClientTypeIds { get; set; } = [];
    public bool IncludeInstitutionEmails { get; set; }
    public bool IncludeContactPerson1Email { get; set; }
    public bool IncludeContactPerson2Email { get; set; }
}
