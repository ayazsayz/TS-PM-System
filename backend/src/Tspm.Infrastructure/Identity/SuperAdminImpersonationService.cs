using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Application.SuperAdmin;
using Tspm.Domain.Common;
using Tspm.Infrastructure.Persistence;

namespace Tspm.Infrastructure.Identity;

public class SuperAdminImpersonationService : ISuperAdminImpersonationService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IAuditLogger _audit;

    public SuperAdminImpersonationService(
        UserManager<ApplicationUser> users,
        AppDbContext db,
        ITokenService tokens,
        IAuditLogger audit)
    {
        _users = users;
        _db = db;
        _tokens = tokens;
        _audit = audit;
    }

    public async Task<ImpersonationResponse?> ImpersonateAsync(Guid targetUserId, Guid actingSuperAdminId, string actingSuperAdminEmail)
    {
        var target = await _users.FindByIdAsync(targetUserId.ToString());
        if (target is null) return null;
        if (!target.IsActive)
            throw AppException.BadRequest("Cannot impersonate an inactive user.");
        if (target.Id == actingSuperAdminId)
            throw AppException.BadRequest("You cannot impersonate yourself.");

        var roles = await _users.GetRolesAsync(target);
        if (roles.Contains(AppRoles.SuperAdmin))
            throw AppException.BadRequest("SuperAdmin users cannot be impersonated.");

        var org = await _db.Organizations.IgnoreQueryFilters()
            .Where(o => o.Id == target.OrganizationId)
            .Select(o => new { o.Id, o.Name })
            .FirstOrDefaultAsync();

        var (accessToken, expiresAt) = _tokens.CreateImpersonationAccessToken(
            target.Id, target.OrganizationId, target.Email!, target.FullName, roles,
            actingSuperAdminId, actingSuperAdminEmail);

        _audit.Log(
            actingSuperAdminId,
            target.OrganizationId,
            "superadmin.impersonate.start",
            $"Impersonation started for {target.FullName} <{target.Email}>",
            targetType: "User",
            targetId: target.Id);
        await _db.SaveChangesAsync(default);

        return new ImpersonationResponse(
            accessToken, expiresAt,
            target.Id, target.FullName, target.Email!,
            target.OrganizationId, org?.Name ?? "—");
    }
}
