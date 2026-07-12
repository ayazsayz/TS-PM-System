using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Api.Controllers;

[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    private ICurrentUser? _currentUser;
    protected ICurrentUser CurrentUser =>
        _currentUser ??= HttpContext.RequestServices.GetRequiredService<ICurrentUser>();

    /// <summary>The authenticated user's id (guaranteed by [Authorize]).</summary>
    protected Guid UserId => CurrentUser.Id ?? throw new UnauthorizedAccessException();
}
