using System.Security.Claims;
using Tspm.Application.Common.Interfaces;
using IdentityRoles = Tspm.Infrastructure.Identity.Roles;

namespace Tspm.Api.Auth;

/// <summary>Reads the authenticated user off the current HTTP request.</summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public Guid? Id =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles =>
        Principal?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

    public bool IsManager =>
        Principal?.IsInRole(IdentityRoles.Manager) == true ||
        Principal?.IsInRole(IdentityRoles.Admin) == true;
}
