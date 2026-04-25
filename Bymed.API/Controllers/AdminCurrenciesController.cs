using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Currencies;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/currencies")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminCurrenciesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateCurrencyDefinitionRequest> _createValidator;
    private readonly IValidator<UpdateCurrencyDefinitionRequest> _updateValidator;

    public AdminCurrenciesController(
        IMediator mediator,
        IValidator<CreateCurrencyDefinitionRequest> createValidator,
        IValidator<UpdateCurrencyDefinitionRequest> updateValidator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CurrencyDefinitionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCurrencyDefinitionsQuery(), cancellationToken).ConfigureAwait(false);
        return Ok(result);
    }

    [HttpGet("{currencyDefinitionId:guid}")]
    [ProducesResponseType(typeof(CurrencyDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid currencyDefinitionId, CancellationToken cancellationToken)
    {
        var result = await _mediator
            .Send(new GetCurrencyDefinitionByIdQuery(currencyDefinitionId), cancellationToken)
            .ConfigureAwait(false);
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    [HttpPost]
    [ProducesResponseType(typeof(CurrencyDefinitionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCurrencyDefinitionRequest request, CancellationToken cancellationToken)
    {
        var validation = await _createValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator.Send(new CreateCurrencyDefinitionCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { currencyDefinitionId = result.Value!.Id }, result.Value);
    }

    [HttpPut("{currencyDefinitionId:guid}")]
    [ProducesResponseType(typeof(CurrencyDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid currencyDefinitionId,
        [FromBody] UpdateCurrencyDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
            return BadRequest(new { errors = validation.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });

        var result = await _mediator
            .Send(new UpdateCurrencyDefinitionCommand(currencyDefinitionId, request), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return result.Error is "Currency not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpDelete("{currencyDefinitionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid currencyDefinitionId, CancellationToken cancellationToken)
    {
        var result = await _mediator
            .Send(new DeleteCurrencyDefinitionCommand(currencyDefinitionId), cancellationToken)
            .ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return NoContent();
    }
}
