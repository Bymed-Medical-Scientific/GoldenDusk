using Bymed.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bymed.API.Controllers;

/// <summary>
/// Base class for admin-only controllers. All actions require the Admin role.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.Admin)]
[Produces("application/json")]
public abstract class AdminControllerBase : ControllerBase
{
}
