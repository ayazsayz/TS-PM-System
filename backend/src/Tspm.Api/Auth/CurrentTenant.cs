using Tspm.Application.Common.Interfaces;

namespace Tspm.Api.Auth;

/// <summary>Reads the tenant (organization) id from the request's <c>org</c> claim.</summary>
public class CurrentTenant : ICurrentTenant
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentTenant(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid? OrganizationId =>
        Guid.TryParse(
            _accessor.HttpContext?.User.FindFirst(ITokenService.OrganizationClaim)?.Value,
            out var id)
            ? id
            : null;
}
