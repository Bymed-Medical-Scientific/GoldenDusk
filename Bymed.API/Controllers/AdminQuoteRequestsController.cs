using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Quotes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[Asp.Versioning.ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/quote-requests")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminQuoteRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminQuoteRequestsController(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<QuoteRequestSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] string? email = null,
        [FromQuery] string? fullName = null,
        [FromQuery] DateTime? dateFromUtc = null,
        [FromQuery] DateTime? dateToUtc = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetQuoteRequestsQuery(pageNumber, pageSize, email, fullName, dateFromUtc, dateToUtc), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }
}
