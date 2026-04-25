using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Contact;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

[ApiController]
[Asp.Versioning.ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/contact-messages")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public sealed class AdminContactMessagesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminContactMessagesController(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ContactMessageSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] string? email = null,
        [FromQuery] string? subject = null,
        [FromQuery] DateTime? dateFromUtc = null,
        [FromQuery] DateTime? dateToUtc = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator
            .Send(new GetContactMessagesQuery(pageNumber, pageSize, email, subject, dateFromUtc, dateToUtc), cancellationToken)
            .ConfigureAwait(false);
        return Ok(result);
    }
}
