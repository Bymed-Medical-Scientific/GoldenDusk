using Asp.Versioning;
using Bymed.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

/// <summary>
/// Base class for admin-only controllers. All actions require the Admin role.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public abstract class AdminControllerBase : ControllerBase
{
}
